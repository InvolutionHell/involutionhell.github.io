# MCP Auth 升级方案

## 当前基础

MCP 的公开 `search` 不需要登录，`publish` 使用 `Authorization: Bearer <satoken>`。Next.js 侧已经准备好两处稳定边界：

1. `verifyToken` 是唯一 token 校验入口，当前调用 Spring Boot `/auth/me`；
2. `/.well-known/oauth-protected-resource` 已存在，当前声明 resource 与 `publish` scope，等授权服务器上线后补 `authorization_servers`。

工具层不判断 token 类型，只使用鉴权层给出的已验证身份和 backend headers。因此 satoken 与 OAuth 可以并行，迁移时不改 MCP tool schema。

## 近期可选优化：sa-token 滑动续期

sa-token 支持在配置层启用基于活动的自动续期（sliding expiration）。如果启用，任意 API 使用都会继续延长当前 30 天窗口，可在 OAuth 上线前大幅减少 MCP 用户重复复制 token 的麻烦。

纯滑动续期的安全代价是：一枚泄露但持续活跃的 token 可能无限期有效，因此建议同时设置绝对最长生命周期。是否启用属于后端配置决策；若采用，必须按 `SECURITY.md` 的安全文化补充成对测试，分别证明正常续期与超过绝对生命周期后拒绝。

## 路线 A：Spring Boot 在 sa-token 上实现 OAuth 2.1

这条路线由现有后端同时承担 Authorization Server 与 Resource Server。用户登录、账号关联、权限判断继续复用当前 sa-token 数据。

### Endpoint checklist

| Endpoint                                      | 责任                                                                |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `GET /.well-known/oauth-authorization-server` | 发布 issuer、authorization/token/registration endpoint、PKCE 能力   |
| `GET /oauth/authorize`                        | 校验 client、redirect URI、resource、scope、state、PKCE challenge   |
| `POST /oauth/authorize`                       | 用户确认授权后签发一次性 authorization code                         |
| `POST /oauth/token`                           | 用 code + PKCE verifier 换 access token，可选签发 refresh token     |
| `POST /oauth/introspect`                      | 给 MCP resource server 校验 token、scope、subject、audience、expiry |
| `POST /oauth/revoke`                          | 撤销 access/refresh token                                           |
| `POST /oauth/register`                        | 如果要支持动态客户端注册，登记 redirect URIs 与 client metadata     |
| `GET /oauth/jwks`                             | 使用 JWT access token 时发布签名公钥                                |

最低安全要求：

- 只允许 Authorization Code + PKCE S256；
- 不提供 implicit flow 和 password grant；
- redirect URI 精确匹配，不接受 wildcard；
- code 单次使用且短 TTL；
- access token 必须绑定 `https://involutionhell.com/api/mcp` resource/audience；
- scope 至少区分 `publish`，默认不能扩大权限；
- refresh token rotation，并检测 reuse；
- state 必须原样校验，浏览器授权流程同时防 CSRF；
- token、code、verifier 不进入应用日志、错误响应和 tracing attribute。

如果继续签发 opaque token，Next.js `verifyToken` 调 introspection；如果签发 JWT，Next.js 可用 issuer/JWKS 本地验证，但 Java `/api/posts` 也必须验证同一 issuer、audience、expiry 与 `publish` scope。

## 路线 B：第三方 IdP，后端只做 access-token validation

Stytch、WorkOS 或 Auth0 承担登录、consent、authorize、token、refresh、revoke、JWKS 和可选动态客户端注册。Spring Boot 不签发 OAuth token，只把自己作为 Resource Server。

### Endpoint checklist

IdP 侧必须提供：

| Endpoint                                              | 责任                        |
| ----------------------------------------------------- | --------------------------- |
| `/.well-known/openid-configuration` 或 OAuth metadata | issuer 与能力发现           |
| `/authorize`                                          | Authorization Code + PKCE   |
| `/token`                                              | code/refresh token exchange |
| `/jwks.json`                                          | JWT 签名公钥                |
| `/revoke`                                             | token 撤销                  |
| `/register`（如启用 DCR）                             | MCP client 动态注册         |

Java 后端需要增加：

| Endpoint/组件                             | 责任                                                               |
| ----------------------------------------- | ------------------------------------------------------------------ |
| OAuth bearer filter                       | 读取 `Authorization: Bearer`，与 legacy `satoken` filter 并行      |
| JWT validator 或 IdP introspection client | 校验 issuer、签名、audience/resource、expiry、not-before、scope    |
| subject-to-user mapper                    | 把 IdP `sub` 稳定映射到 `user_accounts`，禁止按可变 email 临时认人 |
| `GET /auth/me`                            | 同时接受 satoken 与 OAuth token，返回同一 `UserView`               |
| `POST /api/posts`                         | 两种 token 都走同一用户身份与 `publish` 权限检查                   |

IdP tenant 必须把 MCP production resource 配成独立 audience，不要接受发给其他 API 的 access token。账号关联、停用用户、角色变化和 token 撤销后的生效时间要在后端明确。

## 迁移与共存

建议分四阶段：

1. **准备**：保持 `satoken` header 与现有 `Authorization: Bearer <satoken>` MCP 用法；后端测试双 filter 的优先级和冲突处理。
2. **并行**：`/auth/me`、`/api/posts` 同时接受 satoken 和 OAuth access token。一个请求只采用一种身份；如果两个 header 指向不同用户，必须拒绝，不能猜优先级。
3. **MCP 切换**：Next.js `verifyToken` 先识别/验证 OAuth，legacy satoken 作为 fallback。protected-resource metadata 增加真实 `authorization_servers`，客户端逐步重连 OAuth。
4. **收口**：观察 legacy 使用量，给出明确下线日期；撤掉 MCP 的 satoken 支持前，网页现有 satoken 登录不必同步下线。

并行期要保持两条 header 路径：

```http
satoken: <legacy-token>
Authorization: Bearer <oauth-access-token>
```

不要把 OAuth token 复制进 `satoken` header 来假装兼容。两类 token 的 issuer、audience、scope、撤销语义不同，后端应该显式验证。

## Backend 测试义务

每个安全不变量都必须有成对测试：一个合法请求通过，一个只破坏该不变量的请求失败。至少覆盖：

- PKCE S256 正确 verifier / 错误 verifier；
- redirect URI 精确匹配 / 相似域名或 wildcard 拒绝；
- state 保持 / state 缺失或篡改；
- code 首次兑换 / 重放；
- 正确 resource/audience / 错 audience；
- `publish` scope 存在 / 缺 scope；
- 未过期 token / expired、not-before、revoked token；
- 正确 issuer/签名 / 错 issuer、未知 key、算法降级；
- 已绑定 `sub` / 未绑定或停用用户；
- satoken 单独请求、OAuth 单独请求、双 header 同用户、双 header 冲突用户；
- introspection/JWKS 超时、5xx、malformed payload 时 fail closed；
- 日志和错误响应不包含 token、code、refresh token 或 verifier。

所有新增后端代码必须执行：

```bash
./mvnw verify
```

JaCoCo line coverage 不低于 80%。`SECURITY.md` 中新增或修改的每条 invariant 都要同时落一组正向/反向测试；不能只用 controller happy-path 把覆盖率刷到 80%。集成测试还要真实经过 security filter chain，不能全部 mock 掉 token validator。

上线前至少再做一次跨服务 E2E：客户端 authorize → token → MCP initialize → `search` → `publish` → Java 创建 PostView，并验证错误 audience、缺 scope、过期 token 都在写数据库前被拒绝。
