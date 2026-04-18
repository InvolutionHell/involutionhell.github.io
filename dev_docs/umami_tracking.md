# Umami 埋点设计文档

本文档描述了 Involution Hell 网站 (involutionhell.com) 的用户行为埋点设计。使用 Umami v2 进行数据采集。

## 1. 全局导航与交互 (Global Navigation & Interaction)

**内部导航 (Internal Navigation)**: 仅用于网站内部页面的跳转。

| 区域 (Region)       | 元素说明                      | 触发行为 | 埋点事件名 (Event Name) | 埋点传参 (Event Data)                                                              |
| :------------------ | :---------------------------- | :------- | :---------------------- | :--------------------------------------------------------------------------------- |
| **header**          | 导航链接 (特点, 社区等)       | 点击     | `navigation_click`      | `region`: "header", `label`: 链接名 (e.g., "features"), `path`: 目标路径           |
| **footer**          | 归档/资源链接                 | 点击     | `navigation_click`      | `region`: "footer", `label`: 链接名 (e.g., "Mission Brief"), `category`: "archive" |
| **sidebar**         | 文档侧边栏链接                | 点击     | `navigation_click`      | `region`: "sidebar", `label`: 页面标题, `path`: 目标路径                           |
| **toc**             | 目录 (Table of Contents) 链接 | 点击     | `navigation_click`      | `region`: "toc", `label`: 章节标题                                                 |
| **pagination**      | 上一篇/下一篇                 | 点击     | `navigation_click`      | `region`: "pagination", `label`: "prev" / "next", `path`: 目标路径                 |
| **hero_cta**        | 首页 Hero 按钮                | 点击     | `navigation_click`      | `region`: "hero_cta", `label`: "Access Articles"                                   |
| **home_categories** | 首页分类卡片                  | 点击     | `navigation_click`      | `region`: "home_categories", `label`: 分类标题 (e.g., "AI")                        |

**资源与外部链接 (Resources & External Links)**: 用于追踪外部资源、工具或社交媒体的点击。

| 类别 (Category) | 元素说明               | 触发行为 | 埋点事件名 (Event Name) | 埋点传参 (Event Data)                                         |
| :-------------- | :--------------------- | :------- | :---------------------- | :------------------------------------------------------------ |
| **Tool**        | Zotero 文献库          | 点击     | `resource_click`        | `type`: "zotero", `location`: "community_card", `url`: 链接   |
| **Repo**        | GitHub 仓库            | 点击     | `resource_click`        | `type`: "github_repo", `location`: "community_card"           |
| **Community**   | Discord 社区           | 点击     | `resource_click`        | `type`: "discord_invite", `location`: "community_card"        |
| **Social**      | Footer/Header 社交链接 | 点击     | `social_click`          | `platform`: "github"/"discord", `location`: "header"/"footer" |

## 2. 核心功能交互 (Core Features)

| 功能模块   | 动作说明                      | 触发行为 | 埋点事件名 (Event Name) | 埋点传参 (Event Data)                                        |
| :--------- | :---------------------------- | :------- | :---------------------- | :----------------------------------------------------------- |
| **Search** | 执行搜索                      | 提交     | `search_query`          | `query`: 搜索关键词                                          |
| **Search** | 点击搜索结果                  | 点击     | `search_result_click`   | `query`: 搜索关键词, `rank`: 排名 (1-based), `url`: 结果链接 |
| **Theme**  | 切换主题                      | 点击     | `theme_toggle`          | `theme`: "light" / "dark"                                    |
| **Auth**   | 登录 (Header/Login Page)      | 点击     | `auth_click`            | `action`: "signin", `location`: 触发位置                     |
| **Social** | 社交媒体链接 (GitHub/Discord) | 点击     | `social_click`          | `platform`: "github"/"discord", `location`: 触发位置         |

## 3. 内容互动与反馈 (Content Interaction & Feedback)

| 区域             | 元素说明                   | 触发行为 | 埋点事件名 (Event Name)      | 埋点传参 (Event Data)                                    |
| :--------------- | :------------------------- | :------- | :--------------------------- | :------------------------------------------------------- |
| **Content**      | 复制生词/代码块            | 复制     | `content_copy`               | `type`: "code"/"text", `content_length`: 字符数 (number) |
| **Content**      | 页面反馈 (Helpful)         | 点击     | `feedback_submit`            | `page`: 当前页面路径, `vote`: "helpful" / "not_helpful"  |
| **Feature**      | 投稿 (Contribute)          | 点击     | `contribute_trigger`         | `location`: "hero" / "docs"                              |
| **Feature**      | 投稿跳转 (Github Redirect) | 跳转     | `contribute_github_redirect` | `dir`: 目标目录, `filename`: 文件名                      |
| **AI Assistant** | 提问                       | 完成     | `ai_assistant_query`         | _(暂未包含具体参数)_                                     |

## 4. 异常与错误 (Errors)

| 场景    | 说明       | 触发条件      | 埋点事件名 (Event Name) | 埋点传参 (Event Data)                                      |
| :------ | :--------- | :------------ | :---------------------- | :--------------------------------------------------------- |
| **404** | 页面未找到 | 访问 404 页面 | `error_404`             | `path`: 访问路径, `referrer`: 来源页面 (document.referrer) |

## 实施指南

### 统一导航埋点示例

```jsx
// Header Link
<a
  href="#features"
  data-umami-event="navigation_click"
  data-umami-event-region="header"
  data-umami-event-label="features"
>特点</a>

// Sidebar Link (Fumadocs integration example)
<Link
  href="/docs/learn/ai"
  onClick={() => umami.track('navigation_click', { region: 'sidebar', path: '/docs/learn/ai' })}
>Artificial Intelligence</Link>
```

### 搜索埋点示例 (CustomSearchDialog)

```tsx
// 在搜索结果点击时
umami.track("search_result_click", {
  query: searchQuery,
  rank: index + 1,
  url: result.url,
});
```

### 复制监听示例 (CopyTracking)

```tsx
// 自动监听 document copy 事件
umami.track("content_copy", {
  type: isCode ? "code" : "text",
  content_length: selection.toString().length,
});
```
