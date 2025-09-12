# Involution Hell 知识库

## 📋 关于

这是一个基于现代 Web 技术的协作文档平台，旨在帮助学生们分享和访问学习资料。

## ✨ 特性

- 🚀 **现代化技术栈**：Next.js 15 + Fumadocs + MDX
- 🎨 **美观界面**：基于 Tailwind CSS 和 shadcn/ui 构建
- 🌍 **双语支持**：中英文内容
- 📱 **响应式设计**：完美适配所有设备
- ⚡ **快速且 SEO 友好**：静态生成，性能优化
- 🤝 **社区驱动**：开源且协作性强

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm（推荐）

### 安装

```bash
# 克隆仓库
git clone https://github.com/involutionhell/involutionhell.github.io.git
cd involutionhell.github.io

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 查看站点。

## 📁 项目结构

```
📦 involutionhell.github.io
├── 📂 app/                          # Next.js App Router
│   ├── 📂 components/               # React 组件
│   ├── 📂 docs/                     # 文档内容
│   │   └── 📂 computer-science/     # 计算机科学知识库
│   ├── 📄 layout.tsx               # 根布局
│   └── 📄 page.tsx                 # 主页
├── 📂 source.config.ts              # Fumadocs 配置
├── 📂 tailwind.config.ts           # Tailwind CSS 配置
└── 📄 package.json                 # 依赖和脚本
```

## 🤝 贡献

我们欢迎社区贡献！在开始之前，请阅读我们的[贡献指南](CONTRIBUTING.md)。

### 贡献方式

- 📝 **内容**：添加新文章或改进现有文章
- 🐛 **错误修复**：报告并修复问题
- 🎨 **UI/UX**：改进设计和用户体验
- 🌐 **翻译**：帮助多语言支持
- 📖 **文档**：改进项目文档

### 贡献者快速开始

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feat/your-feature`
3. 进行修改
4. 测试修改: `pnpm check:content`
5. 提交 PR

## 📚 文档结构

我们的内容采用分层式的"Folder as a Book"结构：

```
📂 docs/
├── 📂 computer-science/           # 计算机科学
│   ├── 📄 index.mdx               # 计算机科学概述
│   └── 📂 data-structures/        # 数据结构
│       ├── 📄 index.mdx           # 数据结构概述
│       ├── 📂 array/              # 数组
│       │   ├── 📄 index.mdx       # 数组概述
│       │   ├── 📄 01-static-array.mdx
│       │   └── 📄 02-dynamic-array.mdx
│       └── 📂 linked-list/        # 链表
│           ├── 📄 index.mdx       # 链表概述
│           └── 📄 01-singly-linked-list.mdx
```

## 🛠️ 可用脚本

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器

# 内容
 

# 导出
pnpm export           # 导出静态站点到 /out 目录
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 使用 [Next.js](https://nextjs.org/) 构建
- 由 [Fumadocs](https://fumadocs.vercel.app/) 驱动
- 使用 [Tailwind CSS](https://tailwindcss.com/) 样式
- UI 组件来自 [shadcn/ui](https://ui.shadcn.com/)

特别感谢我们所有的贡献者！🎉

## 📞 联系我们

- 📧 Issues: [GitHub Issues](https://github.com/involutionhell/involutionhell.github.io/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/involutionhell/involutionhell.github.io/discussions)
- 🌟 Stars: 通过 ⭐ 表示支持


# Involution Hell Docs

[![Deploy to GitHub Pages](https://github.com/involutionhell/involutionhell.github.io/actions/workflows/deploy.yml/badge.svg)](https://github.com/involutionhell/involutionhell.github.io/actions/workflows/deploy.yml)

**A modern, student-maintained knowledge base for computer science and programming.**

[🌐 View Live Site](https://involutionhell.github.io/) | [📖 Documentation](https://involutionhell.github.io/)

---

## 📋 About

This is a collaborative documentation platform built with modern web technologies, designed to help students share and access high-quality learning materials for computer science and programming.

## ✨ Features

- 🚀 **Modern Tech Stack**: Next.js 15 + Fumadocs + MDX
- 🎨 **Beautiful UI**: Built with Tailwind CSS and shadcn/ui
- 🌍 **Bilingual Support**: Chinese & English content
- 📱 **Responsive Design**: Works perfectly on all devices
- ⚡ **Fast & SEO-friendly**: Static generation with optimal performance
- 🤝 **Community Driven**: Open source and collaborative

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm (recommended)

### Installation

```bash
# Clone the repository
git clone https://github.com/involutionhell/involutionhell.github.io.git
cd involutionhell.github.io

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

## 📁 Project Structure

```
📦 involutionhell.github.io
├── 📂 app/                          # Next.js App Router
│   ├── 📂 components/               # React Components
│   ├── 📂 docs/                     # Documentation Content
│   │   └── 📂 computer-science/     # CS Knowledge Base
│   ├── 📄 layout.tsx               # Root Layout
│   └── 📄 page.tsx                 # Homepage
├── 📂 source.config.ts              # Fumadocs Configuration
├── 📂 tailwind.config.ts           # Tailwind CSS Config
└── 📄 package.json                 # Dependencies & Scripts
```

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](CONTRIBUTING.md) before getting started.

### Ways to Contribute

- 📝 **Content**: Add new articles or improve existing ones
- 🐛 **Bug Fixes**: Report and fix issues
- 🎨 **UI/UX**: Improve design and user experience
- 🌐 **Translations**: Help with multilingual support
- 📖 **Documentation**: Improve project documentation

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes
4. Test your changes: `pnpm check:content`
5. Submit a Pull Request

## 📚 Documentation Structure

Our content follows a hierarchical "Folder as a Book" structure:

```
📂 docs/
├── 📂 computer-science/           # Computer Science
│   ├── 📄 index.mdx               # CS Overview
│   └── 📂 data-structures/        # Data Structures
│       ├── 📄 index.mdx           # DS Overview
│       ├── 📂 array/              # Arrays
│       │   ├── 📄 index.mdx       # Array Overview
│       │   ├── 📄 01-static-array.mdx
│       │   └── 📄 02-dynamic-array.mdx
│       └── 📂 linked-list/        # Linked Lists
│           ├── 📄 index.mdx       # Linked List Overview
│           └── 📄 01-singly-linked-list.mdx
```

## 🛠️ Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server

# Content
 

# Export
pnpm export           # Export static site to /out
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Fumadocs](https://fumadocs.vercel.app/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

Special thanks to all our contributors! 🎉

## 📞 Contact

- 📧 Issues: [GitHub Issues](https://github.com/involutionhell/involutionhell.github.io/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/involutionhell/involutionhell.github.io/discussions)
- 🌟 Stars: Show your support with a ⭐
