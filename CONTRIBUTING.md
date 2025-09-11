# Contributing Guide

感谢你对 **Involution Hell Docs** 的兴趣！
这是一个基于 **Next.js + Contentlayer** 的开源文档站点，内容来自 `docs/` 文件夹。
欢迎提交 Pull Request 或 Issue。

---

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

* **title**: 必填，文档标题
* **description**: 可选，简短说明
* **date**: 可选，发布日期
* **tags**: 可选，标签列表

---

## 🏗️ 构建与导出

### 构建（生成 .next）

```bash
pnpm build
```

### 静态导出（生成 /out 目录）

```bash
pnpm export
```

导出后的 `/out` 就是静态站点，可直接部署到 GitHub Pages。

---

## 🚢 部署

本仓库配置了 **GitHub Actions**，push 到 `main` 分支会自动构建并部署到：

👉 [https://involutionhell.github.io/](https://involutionhell.github.io/)

无需手动操作。

---

## 🤝 如何贡献

1. Fork 本仓库
2. 在新分支进行修改
3. 提交 PR

我们欢迎以下贡献：

* 修正文档内容
* 添加新的教程或指南
* 改进页面样式或交互
