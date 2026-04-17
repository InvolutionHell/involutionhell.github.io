# 贡献指南/Contributing Guide

## 投稿指南

1. 在首页点击「我要投稿」，或在任意文档右上角使用「编辑」/「我要投稿」按钮
   ![button](./public/git_assets/button.png)

2. 因为编辑器自带了内卷地狱的图床供大家直接上传图片便捷使用，因此安全起见必须登录才能使用编辑器功能， 如果你已登录，则会直接进入，如果没登录则会进入以下页面
   ![ae47ad870b3bc27bb54d03d38eb72c8a.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632611288-ae47ad870b3bc27bb54d03d38eb72c8a.png)

   点sign in后，会跳转到github请求登录，登录后即可进入投稿页面。

   首先投稿前需要填写稿件的基本信息：

   ![8a86555b863c1771491981c21367aa47.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632610832-8a86555b863c1771491981c21367aa47.png)

   标签将用于未来辅助人们用分类功能查看文章

   然后下滑即可选择投稿目录：

   浮窗中选择想贡献的章节，也可以先新建一个文件夹

   ![63bc1e3e7e1ea3bd319b8c898bfa19ed.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632610739-63bc1e3e7e1ea3bd319b8c898bfa19ed.png)

   ![96690ba7576ff0bbe82e117a19a218ae.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632610837-96690ba7576ff0bbe82e117a19a218ae.png)

   然后就能进入编辑框开始写文档了

   编辑器是类notion的设计，因此你可以选择文字来添加效果，

   ![1bf581fbc6d1eaa71cf9b91f8c9d5787.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632610704-1bf581fbc6d1eaa71cf9b91f8c9d5787.png)

   也可以直接使用markdown代码来编辑

   <br />

   ```Markdown
   # 标题1
   ## 标题2
   ```

   每点击一行，左边都有加号按钮，可以快捷添加你要的内容块

   ![image.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632611285-image.png)

   ![image.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632610905-image.png)

   ![image.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632610926-image.png)

   ![image.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632611026-image.png)

   加号旁边的格子按钮则是可以拖拽文本块想要放置的位置，上拖下拖

   ![image.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632611017-image.png)

   **值得一提的是编辑器的自带图床功能**

   你只需要粘贴图片到编辑器里，或是用自带的image代码块添加图片

   <br />

   ![image.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632611082-image.png)

   ，提交后，图片就会自动被上传到内卷地狱的图片，再也不需要自己手动配置图床手动上传了！

   等你编辑完了以后，就可以点击底部按钮发布文章了。

3. 页面会跳转到 GitHub

   ![image.png](https://pub-fa1987abe8794da6ba45cdf9284954b3.r2.dev/users/7/contributing-guide/1765632611098-image.png)

   点击右上角的commit changes

4. 点击 `Commit changes`，若是第一次投稿，GitHub 会提示先 Fork 仓库；按提示操作一次即可
   ![fork](./public//git_assets/need_fork.png)

5. Fork 完成后会自动返回原页面，然后一直“下一步”即可
   ![after_fork](./public//git_assets/after_fork.png)
   再点击一次 `Commit changes`
   ![propose](./public//git_assets/propse_changes.png)
   随后进入 PR 流程，按提示一路继续
   ![pr1](./public//git_assets/pr.png)
   ![pr2](./public//git_assets/pr2.png)

6. 恭喜你完成了首次 Pull Request！ 🎉
   ![success](./public//git_assets/succuess.png)

—— 以下是代码贡献流程，若只提交文档可在此结束 ——

---

## Git 提交 Guide

#### 1. 将本项目直接fork到自己的账号下，这样就可以直接在自己的账号下进行修改和提交。

![fork1](./public//git_assets/fork1.jpg)
![fork2](./public//git_assets/fork2.png)

_注意取消勾选仅克隆当前分支_

#### 2. 克隆项目

```
git clone https://github.com/你自己的仓库名/involutionhell.git
```

修改为自己fork的仓库，改为你的https仓库的git地址

#### 3. 创建自己的分支

列出现有分支

```
git branch -a  #用于列出当前Git仓库中所有的分支,包括本地分支和远程分支。
```

![branch-all](./public//git_assets/branch-all.png)

##### 3.1 创建功能分支的约定命名

```
git checkout -b feat/your-feature

# 它的作用是创建一个新的分支并立即切换到该分支上。

具体来说，这个命令相当于同时执行了两个操作：
git branch feat/your-feature - 创建名为 feat/your-feature 的新分支
git checkout feat/your-feature - 切换到这个新创建的分支

其中 feat/your-feature 是分支名称，通常遵循约定式命名：

feat/ 前缀表示这是一个功能（feature）分支
后面的 your-feature 通常是对功能的简要描述
```

##### 3.2 创建文档分支的约定命名

```
git checkout -b doc_raven   # 自定义一个新的分支
#git checkout -b doc_id 分支名字改为你的uid分支名称
```

#### 4. 提交更改分支

```
git add .
根据你的变动情况
git commit -m "add xxx" # 添加信息记录
or
git commit -m "edit xxx" # 修改信息记录
or
git commit -m "delete xxx" #删除信息记录
```

#### 5. 推送分支到远程仓库

```
git push origin doc_raven
```

---

## Q&A

> Windows + VSCode(Cursor) 用户：如遇 Husky 在 VSCode 内置终端阻止提交，请使用外部命令行执行 `git commit`。

> 本地离线调试 Fumadocs 时，如果发现界面加载需要等待远程图片尺寸请求，可以设置环境变量 `DOCS_REMOTE_IMAGE_SIZE=disable` 或直接沿用默认行为（开发模式自动禁用远程图片尺寸请求），显著加快调试速度。如需强制启用远程图片尺寸补全，可手动设置 `DOCS_REMOTE_IMAGE_SIZE=force`。

| `DOCS_REMOTE_IMAGE_SIZE` | 行为说明                                                                         |
| ------------------------ | -------------------------------------------------------------------------------- |
| 未设置（默认）           | 构建时忽略远程图片尺寸请求报错，开发模式下额外禁用远程尺寸请求，避免离线调试受阻 |
| `disable`                | 在任何模式下都跳过远程图片尺寸请求，仅使用文档内手动声明的宽高                   |
| `force`                  | 强制启用远程图片尺寸请求，并在出现错误时抛出异常以暴露问题                       |

### pnpm 版本和 lockfile 相关问题

#### 问题：pnpm-lock.yaml 频繁出现格式变化（单双引号切换）

**原因**：不同版本的 pnpm 使用不同的 YAML 序列化格式，即使依赖关系相同，锁文件的格式也可能不同。

**解决方案**：

1. **确保使用正确的 pnpm 版本**：

   ```bash
   # 检查当前版本
   pnpm --version

   # 应该显示: 10.20.0
   # 如果不是，请使用以下命令之一：

   # 方法 1: 使用 corepack（推荐）
   corepack enable
   corepack prepare pnpm@10.20.0 --activate

   # 方法 2: 全局安装
   npm install -g pnpm@10.20.0
   ```

2. **验证版本一致性**：

   ```bash
   pnpm check:pnpm-version
   ```

3. **如果 lockfile 已经被错误修改**：

   ```bash
   # 丢弃 lockfile 的修改
   git checkout pnpm-lock.yaml

   # 确认使用正确的 pnpm 版本后重新安装
   pnpm install
   ```

4. **在提交前检查**：
   项目的 pre-commit hook 会自动检查 pnpm 版本和 lockfile 变更，如果发现版本不匹配会给出警告。

#### 问题：CI 检查失败，提示 lockfile 不一致

这通常意味着：

1. 你本地使用的 pnpm 版本与项目要求的不一致
2. lockfile 被错误修改或损坏

**解决方案**：

```bash
# 1. 确认并切换到正确的 pnpm 版本
corepack enable
pnpm --version  # 确认是 10.20.0

# 2. 删除 node_modules 和重新安装
rm -rf node_modules
pnpm install

# 3. 检查 lockfile 是否有变更
git status

# 4. 如果没有变更，说明已修复；如果有变更，说明之前的 lockfile 确实有问题
```

#### 问题：为什么要使用 corepack 而不是全局安装？

**Corepack 的优势**：

- 自动读取 `package.json` 的 `packageManager` 字段
- 每个项目可以使用不同的 pnpm 版本而不冲突
- 新贡献者克隆项目后自动使用正确的版本
- 减少版本不匹配导致的问题

**如何为团队启用 corepack**：

```bash
# 一次性设置，之后所有项目都会受益
corepack enable
```

## 🚀 开发环境

### 1. 克隆仓库

```bash
git clone https://github.com/involutionhell/involutionhell.git
cd involutionhell
```

### 2. 安装依赖

**重要：为了避免 pnpm-lock.yaml 格式不一致的问题，请务必使用项目指定的 pnpm 版本！**

本项目已在 `package.json` 中锁定了 pnpm 版本（`"packageManager": "pnpm@10.20.0"`），推荐使用 **corepack** 来自动管理正确的版本：

#### 方式一：使用 Corepack（推荐）

Corepack 是 Node.js 16.9+ 自带的工具，能自动使用 `package.json` 中指定的包管理器版本。

```bash
# 启用 corepack
corepack enable

# 安装依赖（corepack 会自动使用 pnpm@10.20.0）
pnpm install
```

#### 方式二：全局安装指定版本

如果不想使用 corepack，可以手动安装项目指定的 pnpm 版本：

```bash
# 安装 pnpm 10.20.0
npm install -g pnpm@10.20.0

# 安装依赖
pnpm install
```

#### 验证 pnpm 版本

安装完成后，请务必验证你使用的是正确的版本：

```bash
# 检查 pnpm 版本
pnpm --version
# 应该输出: 10.20.0

# 或使用项目提供的检查脚本
pnpm check:pnpm-version
```

#### ⚠️ 为什么版本一致性很重要？

不同版本的 pnpm 在序列化 `pnpm-lock.yaml` 时可能使用不同的格式（如单引号 vs 双引号），导致：

- PR 中产生大量无意义的 diff
- 增加代码审查负担
- 可能导致 CI 检查失败

我们的 CI 工作流会自动检查版本一致性，如果检测到版本不匹配会导致构建失败。

### 3. 本地开发

运行开发服务器：

```bash
pnpm dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

修改 `docs/` 下的 `.md` 文件，会自动热更新。

---

## 🛠️ 可用脚本

常用脚本集中在 `package.json` 中，以下是最常用的命令：

```bash
pnpm dev                  # 启动开发服务器
pnpm build                # 构建生产版本
pnpm start                # 启动生产服务器
pnpm lint:images          # 检查图片是否符合规范
pnpm migrate:images       # 自动迁移图片到对应 assets 目录
pnpm check:pnpm-version   # 检查 pnpm 版本是否与 package.json 一致
pnpm check:lockfile       # 检查 lockfile 是否有未预期的修改
pnpm postinstall          # 同步必要的 Husky/Fumadocs 配置
```

---

## 🔐 基础设施访问

项目除了 GitHub 仓库，还有几个对外/对内服务。所有登录都走**同一个 GitHub 账号**，不再有每处独立密码。

### 服务一览

| 用途         | URL                                             | 谁能进                                  | 登录方式                                |
| ------------ | ----------------------------------------------- | --------------------------------------- | --------------------------------------- |
| 主站         | `https://involutionhell.com`                    | 所有登录用户                            | GitHub OAuth                            |
| 后端 API     | `https://api.involutionhell.com`                | — (内部调用)                            | sa-token (cookie/header)                |
| **密钥管理** | `https://secrets.involutionhell.com`            | **所有登录协作者**，按 project 权限查看 | GitHub OAuth（复用主站 App）            |
| 数据库管理   | `https://api.involutionhell.com/admin/pgadmin/` | **仅 admin**                            | 主站 cookie 自动通过 Caddy forward_auth |
| 网站分析     | `https://umami.involutionhell.com`              | **仅 admin**                            | 本地 umami 账号                         |

### 怎么拿到 admin / 密钥权限

1. **申请 admin 角色**：现有 superadmin 在 `/admin/users` 页面勾选即可授予（产品规则：superadmin 本身不能通过 API 变动）
2. **申请 Infisical 项目访问**：登录 `secrets.involutionhell.com` 后（GitHub OAuth 自动建账号），联系现有 admin 加到对应 project。Infisical 内部按 environment 分 `dev` / `prod` / `shared`
3. **不要自己手动 INSERT `user_accounts` 表挂 admin 角色** —— OAuth 登录按 `github_<id>` 匹配 username，手工 insert 的人类 username 行永远是孤儿，用户登录后会另开一行丢 admin。历史上有人踩过

### `.env` 文件规则

- 本地 dev：
  - 后端：`involution-hell-project/backend/.env`（`set -a && . ./.env && set +a` 注入 Spring Boot）
  - 前端：`involution-hell-project/frontend/.env`
- 生产：`/home/ubuntu/involution-hell/.env`（**只在部署机**，不在仓库里；CI 不覆盖）
- 两份 .env **故意有差异**（PGHOST / SERVER_PORT / AUTH_URL）—— 不要强行统一，参见 wiki [Changelog 2026-04-17](https://github.com/InvolutionHell/involutionhell/wiki/Changelog-2026-04-17-Self-Hosted-Infra) 的架构说明
- **所有秘密值**将来会迁到 Infisical 单一真源，`.env` 只存极少数 bootstrap 配置。改动期间前后仓两份并存，改值要同步改两处

### 开发者自助入口

登录主站后，访问**自己**的个人主页 `/u/<你的 github id>`，在顶部按钮栏能看到：

- **密钥管理 ↗**（本人访问自己主页时可见） → 跳 Infisical
- **管理员界面**（仅 admin 本人访问自己主页时可见） → 跳 `/admin`
- **编辑**（仅本人访问自己主页时可见） → 跳 profile 编辑

三个按钮都走 "只有本人看自己主页时才渲染"，路人和其他登录用户在这里看不到。
**但 Infisical 站本身** (`secrets.involutionhell.com`) **对所有登录协作者开放** ——
入口按钮只是 UX 便利，不影响访问权（路人可以直接敲地址栏进入）。

### Spring Boot 后端本地启动

```bash
cd involution-hell-project/backend
set -a && . ./.env && set +a   # .env 里有 SERVER_PORT=8081 等
./mvnw spring-boot:run
```

前端 `BACKEND_URL` 指 `http://localhost:8081`，前后一致。

---

## 📚 文档规范

所有文档放在 `docs/` 目录。
图片需要放在 被引用的文档的同名`assets`目录下(正常情况下您不应该关心这个, 该项目有自动脚本来移动图片), 例如:
docxA 引用了 imgA 图片, 那么他们的文档结构应该是 `docxA.assets/imgA`:

```md
docsA.md
docsA.assets/
imgA
```

![img](public/readme_docs_structure.png)

每个文档都需要一个 Frontmatter，例如：

```md
---
title: Hello World
description: 简短描述
date: "2025-09-11"
tags:
  - intro
---

# Hello World

这是正文内容。
```

**必填字段:**

- **title**: 必填，文档标题

**可选字段:**

- **description**: 简短说明
- **date**: 发布日期
- **tags**: 标签列表

---

## 📁 目录结构

我们的文档采用分层式的 **"Folder as a Book"** 结构，会自动生成 URL 和导航。

### 当前结构

```
📂 docs/
├── 📂 computer-science/           # 计算机科学
│   ├── 📄 index.md               # 概述
│   └── 📂 data-structures/        # 数据结构
│       ├── 📄 index.md           # 概述
│       ├── 📂 array/              # 数组
│       │   ├── 📄 index.md       # 概述
│       │   ├── 📄 01-static-array.md    # 静态数组
│       │   └── 📄 02-dynamic-array.md   # 动态数组
│       └── 📂 linked-list/        # 链表
│           ├── 📄 index.md       # 概述
│           └── 📄 01-singly-linked-list.md  # 单向链表
```

### URL 生成

文件结构会自动生成简洁的 URL：

- `docs/computer-science/index.md` → `/computer-science`
- `docs/computer-science/data-structures/array/01-static-array.md` → `/computer-science/data-structures/array/static-array`

### 命名约定

**文件夹:**

- 使用 `kebab-case` 命名: `computer-science`, `data-structures`
- 每个主题文件夹应该有一个 `index.md` 文件作为概述

**文件:**

- 使用 `kebab-case` 命名: `static-array.md`
- 使用数字前缀排序: `01-`, `02-`
- 前缀会自动从最终 URL 中移除

---

## 📝 写作指南

### 内容质量

- **准确性**：确保技术准确性
- **清晰性**：编写清晰易懂的解释
- **完整性**：全面覆盖主题
- **示例**：包含实际代码示例
- **更新**：保持内容更新

### Markdown 最佳实践

- 使用正确的标题层次结构 (h1 → h2 → h3)
- 包含带有语法高亮的代码块
- 使用表格进行比较
- 为图片添加替代文本
- 使用链接引用相关内容

### 代码示例

```javascript
// ✅ 好的做法：清晰、有注释的代码
function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid; // 找到目标
    } else if (arr[mid] < target) {
      left = mid + 1; // 搜索右半部分
    } else {
      right = mid - 1; // 搜索左半部分
    }
  }

  return -1; // 未找到目标
}
```

### 语言风格

- **英文**：使用清晰、专业的英文
- **中文**：在需要时使用正式的学术中文
- **技术术语**：使用标准技术术语
- **一致性**：在整个文档中保持一致的术语

---

## 🏗️ 构建与导出

### 构建（生成 .next）

```bash
pnpm build
```

这会在 `.next` 文件夹中创建优化的生产构建。

### 静态导出（生成 /out 目录）

```bash
pnpm export
```

导出后的 `/out` 目录包含静态站点，可直接部署到 GitHub Pages。

---

## 🚢 部署

本仓库配置了 **GitHub Actions**，push 到 `main` 分支会自动构建并部署到：

👉 [https://involutionhell.com/](https://involutionhell.com/)

无需手动操作。

---

## 🤝 如何贡献

### 基本工作流程

1. Fork 本仓库
2. 为修改创建新分支
3. 进行修改
4. 测试修改
5. 提交 PR

### 贡献类型

我们欢迎以下类型的贡献：

**📝 内容贡献**

- 修正文档内容
- 添加新的教程或指南
- 将内容翻译成其他语言
- 改进现有文章

**🐛 错误修复**

- 修复拼写和语法错误
- 修复损坏的链接
- 修复错误信息
- 改进代码示例

**🎨 UI/UX 改进**

- 改进页面样式
- 增强用户交互
- 改进移动端响应性
- 为 UI 添加新功能

#### 💡 UI 开发建议

**优先使用 Fumadocs UI 组件库**：

本项目已迁移到 **Fumadocs UI** 作为主要 UI 框架。请在进行 UI 相关开发时优先考虑：

1. **使用 Fumadocs UI 组件**：
   - 查看 [Fumadocs UI 文档](https://fumadocs.dev/docs/ui) 了解可用组件
   - 优先使用内置组件而不是自定义实现
   - 遵循 Fumadocs UI 的设计规范和样式指南

2. **保持设计一致性**：
   - 使用统一的颜色方案和字体
   - 遵循现有的组件样式和交互模式
   - 保持响应式设计的兼容性

3. **新功能开发**：
   - 在提 issue 讨论新功能需求时，请明确 UI 方面的具体要求
   - 优先考虑使用 Fumadocs UI 的扩展功能
   - 如需自定义组件，请与团队讨论以保持一致性

4. **测试要求**：
   - 确保新 UI 功能在不同设备和屏幕尺寸下正常工作
   - 测试主题切换（浅色/深色模式）兼容性
   - 验证无障碍访问功能

**🛠️ 技术改进**

- 改进构建过程
- 添加新的脚本或工具
- 优化性能
- 改进可访问性

---

## 🔄 代码审查流程

1. **自动检查**
   - GitHub Actions 将运行自动化测试
   - Fumadocs 将验证你的内容
   - Linting 将检查代码质量

2. **同行评审**
   - 至少一位维护者将审查你的 PR
   - 审阅者可能会要求修改
   - 你可以根据反馈更新你的 PR

3. **合并**
   - 一旦批准，维护者将合并你的 PR
   - 你的贡献将自动部署
