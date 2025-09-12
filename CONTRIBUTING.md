# 贡献指南/Contributing Guide

## 🚀 开发环境

### 1. 克隆仓库

```bash
git clone https://github.com/involutionhell/involutionhell.github.io.git
cd involutionhell.github.io
```

### 2. 安装依赖

我们使用 **pnpm** 作为包管理工具：

```bash
pnpm install
```

如果你还没有安装 pnpm：

```bash
npm install -g pnpm
```

### 3. 本地开发

运行开发服务器：

```bash
pnpm dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)。

修改 `docs/` 下的 `.md` 或 `.mdx` 文件，会自动热更新。

---

## 📚 文档规范

所有文档放在 `docs/` 目录。
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
* **title**: 必填，文档标题

**可选字段:**
* **description**: 简短说明
* **date**: 发布日期
* **tags**: 标签列表

---

## 📁 目录结构

我们的文档采用分层式的 **"Folder as a Book"** 结构，会自动生成 URL 和导航。

### 当前结构

```
📂 docs/
├── 📂 computer-science/           # 计算机科学
│   ├── 📄 index.mdx               # 概述
│   └── 📂 data-structures/        # 数据结构
│       ├── 📄 index.mdx           # 概述
│       ├── 📂 array/              # 数组
│       │   ├── 📄 index.mdx       # 概述
│       │   ├── 📄 01-static-array.mdx    # 静态数组
│       │   └── 📄 02-dynamic-array.mdx   # 动态数组
│       └── 📂 linked-list/        # 链表
│           ├── 📄 index.mdx       # 概述
│           └── 📄 01-singly-linked-list.mdx  # 单向链表
```

### URL 生成

文件结构会自动生成简洁的 URL：

- `docs/computer-science/index.mdx` → `/computer-science`
- `docs/computer-science/data-structures/array/01-static-array.mdx` → `/computer-science/data-structures/array/static-array`

### 命名约定

**文件夹:**
- 使用 `kebab-case` 命名: `computer-science`, `data-structures`
- 每个主题文件夹应该有一个 `index.mdx` 文件作为概述

**文件:**
- 使用 `kebab-case` 命名: `static-array.mdx`
- 使用数字前缀排序: `01-`, `02-`
- 前缀会自动从最终 URL 中移除

---

## ✍️ 添加新文章

### 步骤1：选择位置

确定你的文章在现有结构中的位置：

```bash
# 示例：添加新的数据结构主题
docs/computer-science/data-structures/new-topic/

# 示例：为现有主题添加文章
docs/computer-science/data-structures/array/03-new-array-type.mdx
```

### 步骤2：创建文件

创建新的 `.mdx` 文件，并包含正确的 Frontmatter：

```bash
# 如需要创建目录
mkdir -p docs/computer-science/data-structures/new-topic

# 创建文件
touch docs/computer-science/data-structures/new-topic/index.mdx
```

### 步骤3：编写内容

使用 Markdown/MDX 编写文章：

```mdx
---
title: "文章标题"
description: "文章简短描述"
date: "2024-01-15"
tags:
  - your-topic
  - another-tag
---

# 文章标题

## 引言

这里是内容...

## 第一节

更多内容...

## 代码示例

```javascript
// 你的代码
function example() {
    return "Hello World!";
}
```

## 总结

文章总结...
```

### 步骤4：测试修改

使用 Fumadocs 验证内容：

```bash
pnpm build
```

此命令将：
- 验证 Frontmatter 语法
- 检查 MDX 错误
- 生成预览内容

### 步骤5：本地预览

启动开发服务器并预览修改：

```bash
pnpm dev
```

访问 `http://localhost:3000` 查看新内容。

### 步骤6：提交 PR

1. 提交修改：
   ```bash
   git add .
   git commit -m "Add: New article about [topic]"
   ```

2. 推送到你的 fork：
   ```bash
   git push origin feat/your-article
   ```

3. 创建 Pull Request

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

👉 [https://involutionhell.github.io/](https://involutionhell.github.io/)

无需手动操作。

---

## 📋 开发流程

### 🔄 功能开发前请先提 Issue

**重要提醒**：在开始任何功能开发之前，请先在 [GitHub Issues](../../issues) 中创建或查找相关 issue。这有助于：

- **避免重复开发**：确保不会与他人正在进行的开发冲突
- **统一开发方向**：通过讨论确定功能的具体需求和实现方案
- **透明开发进度**：让社区了解项目当前开发状态
- **便于协作**：其他贡献者可以参与讨论和提供建议

#### 创建 Issue 的最佳实践

1. **检查现有 Issue**：先搜索是否已有相关 issue，避免重复创建
2. **清晰描述**：详细说明功能需求、预期效果和使用场景
3. **添加标签**：使用合适的标签（如 `enhancement`, `feature`, `discussion`）
4. **关联开发分支**：如果开始开发，请在 issue 中链接你的开发分支

#### Issue 类型建议

- **功能请求** (`feature`): 新功能需求
- **改进建议** (`enhancement`): 现有功能的改进
- **问题反馈** (`bug`): 发现的bug或问题
- **讨论话题** (`discussion`): 需要社区讨论的话题

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

## 📋 PR 指南

### PR 标题格式

请使用以下格式之一作为 PR 标题：

```
Add: New article about [topic]          # 添加新文章
Fix: Typo in [file]                     # 修复错误
Update: Improve [feature]               # 更新改进
Docs: Update contribution guidelines    # 文档更新
Feat: Add [new feature]                 # 新功能
```

### PR 描述

好的 PR 描述应该包括：

1. **做了什么修改？**
2. **为什么需要这些修改？**
3. **如何测试这些修改？**
4. **有破坏性更改吗？**

### PR 描述示例

```markdown
## What
Added a new article about dynamic programming algorithms.

## Why
Students need better resources for understanding dynamic programming concepts.

## How
- Created new MDX file with comprehensive examples
- Tested content generation with `pnpm build`
- Verified rendering on local development server

## Testing
- Fumadocs validation passed
- No linting errors
- Previewed locally at `/computer-science/algorithms/dynamic-programming`
```

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

---

## 📞 获取帮助

如果你在贡献过程中需要帮助：

- **📧 Issues**：为问题或错误创建 issue
- **💬 Discussions**：使用 GitHub Discussions 进行一般性问题讨论
- **📖 Documentation**：查看此 CONTRIBUTING.md 文件
- **👥 Community**：加入我们的社区讨论

---

## 🎉 认可

贡献者将：
- 被列入仓库贡献者名单
- 在发布说明中提及重要贡献
- 在我们的文档中得到认可

---

## 📜 行为准则

请在所有互动中保持尊重和包容。我们遵循行为准则以确保积极的社区体验。

---

感谢你为 Involution Hell Docs 做出的贡献！🎉


# Contributing Guide

Thank you for your interest in **Involution Hell Docs**!
This is an open-source documentation site built with **Next.js + Fumadocs**, with content stored in the `app/docs/` folder.
We welcome Pull Requests and Issues!

---

## 🚀 Development Environment

### 1. Clone Repository

```bash
git clone https://github.com/involutionhell/involutionhell.github.io.git
cd involutionhell.github.io
```

### 2. Install Dependencies

We use **pnpm** as our package manager:

```bash
pnpm install
```

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

### 3. Local Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Changes to `.md` or `.mdx` files in the `docs/` folder will auto-update.

---

## 📚 Content Standards

All documentation is stored in the `docs/` directory.
Each document needs a Frontmatter header, for example:

```md
---
title: Hello World
description: Brief description
date: "2025-09-11"
tags:
  - intro
---

# Hello World

This is the main content.
```

**Required fields:**
* **title**: Required, document title

**Optional fields:**
* **description**: Brief description
* **date**: Publication date
* **tags**: Tag list

---

## 📁 Directory Structure

Our documentation follows a hierarchical **"Folder as a Book"** structure that automatically generates URLs and navigation.

### Current Structure

```
📂 docs/
├── 📂 computer-science/           # Computer Science
│   ├── 📄 index.mdx               # Overview
│   └── 📂 data-structures/        # Data Structures
│       ├── 📄 index.mdx           # Overview
│       ├── 📂 array/              # Arrays
│       │   ├── 📄 index.mdx       # Overview
│       │   ├── 📄 01-static-array.mdx    # Static Arrays
│       │   └── 📄 02-dynamic-array.mdx   # Dynamic Arrays
│       └── 📂 linked-list/        # Linked Lists
│           ├── 📄 index.mdx       # Overview
│           └── 📄 01-singly-linked-list.mdx  # Singly Linked List
```

### URL Generation

The file structure automatically generates clean URLs:

- `docs/computer-science/index.mdx` → `/computer-science`
- `docs/computer-science/data-structures/array/01-static-array.mdx` → `/computer-science/data-structures/array/static-array`

### Naming Conventions

**Folders:**
- Use `kebab-case` for folder names: `computer-science`, `data-structures`
- Each topic folder should have an `index.mdx` file as the overview

**Files:**
- Use `kebab-case` for file names: `static-array.mdx`
- Use numeric prefixes for ordering: `01-`, `02-`
- The prefix is removed from the final URL automatically

---

## ✍️ Adding New Articles

### Step 1: Choose Location

Decide where your article fits in the existing structure:

```bash
# Example: Adding a new data structures topic
docs/computer-science/data-structures/new-topic/

# Example: Adding an article to existing topic
docs/computer-science/data-structures/array/03-new-array-type.mdx
```

### Step 2: Create the File

Create a new `.mdx` file with proper Frontmatter:

```bash
# Create directory if needed
mkdir -p docs/computer-science/data-structures/new-topic

# Create the file
touch docs/computer-science/data-structures/new-topic/index.mdx
```

### Step 3: Write Content

Write your article using Markdown/MDX:

```mdx
---
title: "Your Article Title"
description: "Brief description of your article"
date: "2024-01-15"
tags:
  - your-topic
  - another-tag
---

# Your Article Title

## Introduction

Your content here...

## Section 1

More content...

## Code Examples

```javascript
// Your code here
function example() {
    return "Hello World!";
}
```

## Conclusion

Summary of your article...
```

### Step 4: Test Your Changes

Validate your content with Fumadocs:

```bash
pnpm build
```

This command will:
- Validate your Frontmatter syntax
- Check for any MDX errors
- Generate the content for preview

### Step 5: Preview Locally

Start the development server and preview your changes:

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your new content.

### Step 6: Submit PR

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Add: New article about [topic]"
   ```

2. Push to your fork:
   ```bash
   git push origin feat/your-article
   ```

3. Create a Pull Request

---

## 📝 Writing Guidelines

### Content Quality

- **Accuracy**: Ensure technical accuracy
- **Clarity**: Write clear, understandable explanations
- **Completeness**: Cover topics thoroughly
- **Examples**: Include practical code examples
- **Updates**: Keep content current

### Markdown Best Practices

- Use proper heading hierarchy (h1 → h2 → h3)
- Include code blocks with syntax highlighting
- Use tables for comparisons
- Add alt text to images
- Use links to reference related content

### Code Examples

```javascript
// ✅ Good: Clear, commented code
function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);

        if (arr[mid] === target) {
            return mid; // Found target
        } else if (arr[mid] < target) {
            left = mid + 1; // Search right half
        } else {
            right = mid - 1; // Search left half
        }
    }

    return -1; // Target not found
}
```

### Language Style

- **English**: Use clear, professional English
- **Chinese**: Use formal, academic Chinese when needed
- **Technical Terms**: Use standard technical terminology
- **Consistency**: Maintain consistent terminology throughout

---

## 🏗️ Build and Export

### Build (Generate .next)

```bash
pnpm build
```

This creates an optimized production build in the `.next` folder.

### Static Export (Generate /out directory)

```bash
pnpm export
```

The exported `/out` directory contains the static site, ready for deployment to GitHub Pages.

---

## 🚢 Deployment

This repository is configured with **GitHub Actions**. Pushing to the `main` branch will automatically build and deploy to:

👉 [https://involutionhell.github.io/](https://involutionhell.github.io/)

No manual operation required!

---

## 📋 Development Workflow

### 🔄 Create an Issue Before Starting Development

**Important Reminder**: Before starting any feature development, please first create or find a related issue in [GitHub Issues](../../issues). This helps to:

- **Avoid Duplicate Work**: Ensure no conflicts with others' ongoing development
- **Align Development Direction**: Determine specific requirements and implementation plans through discussion
- **Transparent Progress**: Keep the community informed about project development status
- **Facilitate Collaboration**: Allow other contributors to participate in discussions and provide suggestions

#### Best Practices for Creating Issues

1. **Check Existing Issues**: First search for related issues to avoid duplication
2. **Clear Description**: Detail the feature requirements, expected outcomes, and use cases
3. **Add Labels**: Use appropriate labels (e.g., `enhancement`, `feature`, `discussion`)
4. **Link Development Branch**: If development begins, link your development branch in the issue

#### Recommended Issue Types

- **Feature Request** (`feature`): New feature requirements
- **Enhancement** (`enhancement`): Improvements to existing features
- **Bug Report** (`bug`): Bugs or issues found
- **Discussion** (`discussion`): Topics requiring community discussion

---

## 🤝 How to Contribute

### Basic Workflow

1. Fork the repository
2. Create a new branch for your changes
3. Make your changes
4. Test your changes
5. Submit a Pull Request

### Types of Contributions

We welcome the following types of contributions:

**📝 Content Contributions**
- Fix documentation content
- Add new tutorials or guides
- Translate content to other languages
- Improve existing articles

**🐛 Bug Fixes**
- Fix typos and grammar errors
- Fix broken links
- Fix incorrect information
- Improve code examples

**🎨 UI/UX Improvements**
- Improve page styling
- Enhance user interactions
- Improve mobile responsiveness
- Add new features to the UI

#### 💡 UI Development Recommendations

**Prioritize Fumadocs UI Component Library**:

This project has migrated to **Fumadocs UI** as the primary UI framework. Please prioritize the following when developing UI-related features:

1. **Use Fumadocs UI Components**:
   - Check [Fumadocs UI documentation](https://fumadocs.dev/docs/ui) for available components
   - Prefer built-in components over custom implementations
   - Follow Fumadocs UI design standards and style guidelines

2. **Maintain Design Consistency**:
   - Use unified color schemes and fonts
   - Follow existing component styles and interaction patterns
   - Maintain responsive design compatibility

3. **New Feature Development**:
   - When creating issues for new features, clearly specify UI requirements
   - Prioritize Fumadocs UI's extension features
   - Discuss custom components with the team to maintain consistency

4. **Testing Requirements**:
   - Ensure new UI features work across different devices and screen sizes
   - Test theme switching (light/dark mode) compatibility
   - Verify accessibility features

**🛠️ Technical Improvements**
- Improve build process
- Add new scripts or tools
- Optimize performance
- Improve accessibility

---

## 📋 Pull Request Guidelines

### PR Title Format

Please use one of the following formats for your PR title:

```
Add: New article about [topic]          # 添加新文章
Fix: Typo in [file]                     # 修复错误
Update: Improve [feature]               # 更新改进
Docs: Update contribution guidelines    # 文档更新
Feat: Add [new feature]                 # 新功能
```

### PR Description

A good PR description should include:

1. **What changes were made?**
2. **Why were these changes needed?**
3. **How were the changes tested?**
4. **Any breaking changes?**

### Example PR Description

```markdown
## What
Added a new article about dynamic programming algorithms.

## Why
Students need better resources for understanding dynamic programming concepts.

## How
- Created new MDX file with comprehensive examples
- Tested content generation with `pnpm build`
- Verified rendering on local development server

## Testing
- Fumadocs validation passed
- No linting errors
- Previewed locally at `/computer-science/algorithms/dynamic-programming`
```

---

## 🔄 Code Review Process

1. **Automated Checks**
   - GitHub Actions will run automated tests
   - Fumadocs validation will check your content
   - Linting will check code quality

2. **Peer Review**
   - At least one maintainer will review your PR
   - Reviewers may request changes
   - You can update your PR based on feedback

3. **Merge**
   - Once approved, a maintainer will merge your PR
   - Your contribution will be automatically deployed

---

## 📞 Getting Help

If you need help with contributing:

- **📧 Issues**: Open an issue for questions or bugs
- **💬 Discussions**: Use GitHub Discussions for general questions
- **📖 Documentation**: Check this CONTRIBUTING.md file
- **👥 Community**: Join our community discussions

---

## 🎉 Recognition

Contributors will be:
- Listed in the repository contributors
- Mentioned in release notes for significant contributions
- Recognized in our documentation

---

## 📜 Code of Conduct

Please be respectful and inclusive in all interactions. We follow a code of conduct to ensure a positive community experience.

---

Thank you for contributing to Involution Hell Docs! 🎉
