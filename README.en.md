<p align="right">
  <a href="./README.md">简体中文</a> | <a href="./README.en.md">English</a>
</p>

<p align="center">
  <a href="https://involutionhell.com/?utm_source=github&utm_medium=readme&utm_campaign=logo">
    <picture>
      <!-- Dark mode logo -->
      <source media="(prefers-color-scheme: dark)" srcset="./public/logo/logoInDark.svg">
      <!-- Light mode logo -->
      <source media="(prefers-color-scheme: light)" srcset="./public/logo/logoInLight.svg">
      <!-- Fallback (legacy browsers, or if media query fails) -->
      <img src="./public/mascot.svg" width="150" alt="Involution Hell Logo">
    </picture>
  </a>
</p>

<p align="center"><a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=700&size=32&pause=1000&color=f6671b&center=true&vCenter=true&width=280&lines=Involution+Hell&duration=3000" alt="Typing SVG" /></a></p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  <a href="https://github.com/InvolutionHell/involutionhell/blob/main/LICENSE">
  <a href="https://involutionhell.com/?utm_source=github&utm_medium=readme&utm_campaign=badge">
    <img src="https://img.shields.io/badge/Website-involutionhell.com-blue?style=for-the-badge" alt="Official Website">
  </a>
</p>

---

## 📋 About

[![zread](https://img.shields.io/badge/Ask_Zread-_.svg?style=flat&color=00b0aa&labelColor=000000&logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQuOTYxNTYgMS42MDAxSDIuMjQxNTZDMS44ODgxIDEuNjAwMSAxLjYwMTU2IDEuODg2NjQgMS42MDE1NiAyLjI0MDFWNC45NjAxQzEuNjAxNTYgNS4zMTM1NiAxLjg4ODEgNS42MDAxIDIuMjQxNTYgNS42MDAxSDQuOTYxNTZDNS4zMTUwMiA1LjYwMDEgNS42MDE1NiA1LjMxMzU2IDUuNjAxNTYgNC45NjAxVjIuMjQwMUM1LjYwMTU2IDEuODg2NjQgNS4zMTUwMiAxLjYwMDEgNC45NjE1NiAxLjYwMDFaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00Ljk2MTU2IDEwLjM5OTlIMi4yNDE1NkMxLjg4ODEgMTAuMzk5OSAxLjYwMTU2IDEwLjY4NjQgMS42MDE1NiAxMS4wMzk5VjEzLjc1OTlDMS42MDE1NiAxNC4xMTM0IDEuODg4MSAxNC4zOTk5IDIuMjQxNTYgMTQuMzk5OUg0Ljk2MTU2QzUuMzE1MDIgMTQuMzk5OSA1LjYwMTU2IDE0LjExMzQgNS42MDE1NiAxMy43NTk5VjExLjAzOTlDNS42MDE1NiAxMC42ODY0IDUuMzE1MDIgMTAuMzk5OSA0Ljk2MTU2IDEwLjM5OTlaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik0xMy43NTg0IDEuNjAwMUgxMS4wMzg0QzEwLjY4NSAxLjYwMDEgMTAuMzk4NCAxLjg4NjY0IDEwLjM5ODQgMi4yNDAxVjQuOTYwMUMxMC4zOTg0IDUuMzEzNTYgMTAuNjg1IDUuNjAwMSAxMS4wMzg0IDUuNjAwMUgxMy43NTg0QzE0LjExMTkgNS42MDAxIDE0LjM5ODQgNS4zMTM1NiAxNC4zOTg0IDQuOTYwMVYyLjI0MDFDMTQuMzk4NCAxLjg4NjY0IDE0LjExMTkgMS42MDAxIDEzLjc1ODQgMS42MDAxWiIgZmlsbD0iI2ZmZiIvPgo8cGF0aCBkPSJNNCAxMkwxMiA0TDQgMTJaIiBmaWxsPSIjZmZmIi8%2BCjxwYXRoIGQ9Ik00IDEyTDEyIDQiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8L3N2Zz4K&logoColor=ffffff)](https://zread.ai/InvolutionHell/involutionhell.github.io)

A collaborative documentation platform built with modern web technologies to help students share study notes, course materials, and project experience.

**Highlights**

- High-performance site powered by Next.js App Router and Fumadocs UI
- Multi-language support with a "folder as navigation" content model
- Automated deployment, image migration, and linting to reduce maintenance overhead

## 🚀 Quick Start

**Prerequisites**

- Node.js 18+
- pnpm 10.20.0 (locked version - see installation instructions below)

**Local preview**

```bash
git clone https://github.com/involutionhell/involutionhell.git
cd involutionhell

# Recommended: Use corepack (comes with Node.js 16.9+)
corepack enable

# Or install the specific pnpm version globally
npm install -g pnpm@10.20.0

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

⚠️ **Important**: This project locks pnpm to version `10.20.0` in `package.json`. Please use the same version to avoid `pnpm-lock.yaml` format inconsistencies. Check your version with `pnpm --version` or run `pnpm check:pnpm-version` to verify.

Visit [http://localhost:3000](http://localhost:3000) in your browser.

> On Windows with VSCode(Cursor) you may hit a Husky hook issue. Run `git commit` from a terminal instead.

Looking for additional scripts, debugging tips, or contribution workflows? Check out [CONTRIBUTING.md](CONTRIBUTING.md).

## 📁 Directory Overview

```
📦 involutionhell
├── 📂 app/              # Next.js App Router
│   ├── 📂 components/   # UI components
│   ├── 📂 docs/         # Content (folder-as-a-book)
│   └── 📄 layout.tsx    # Root layout
├── 📄 source.config.ts  # Fumadocs configuration
├── 📄 tailwind.config.ts
└── 📄 package.json
```

Documentation follows a layered "Folder as a Book" structure. Naming rules, required frontmatter, and authoring tips live in the contribution guide.

## 🤝 Contribute Together

Community contributions are always welcome:

- Content & translations
- Bug fixes and tooling improvements
- UI / UX design and implementation
- Documentation and workflow enhancements

For the full workflow, PR checklist, and UI collaboration guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

[![Contributors](https://contrib.rocks/image?repo=InvolutionHell/involutionhell)](https://github.com/InvolutionHell/involutionhell/graphs/contributors)

## 🖼️ Documentation & Assets

The repo ships with automated image migration and linting. Learn how to place assets, reference images, and structure frontmatter in:

- [Documentation guidelines & asset rules](CONTRIBUTING.md#-文档规范)
- [Available scripts & automation](CONTRIBUTING.md#-可用脚本)

## 🙏 Special Thanks

Thanks to Shanghai AI Lab for providing computing support!

![](./public/shanghaiailab.png)

- [InternS1 Project](https://github.com/InternLM/Intern-S1/tree/main)
- [InternStudio Platform](https://studio.intern-ai.org.cn/console/dashboard)
- [Puyu API Docs](https://internlm.intern-ai.org.cn/api/document)

## ⭐️ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=InvolutionHell/involutionhell&type=Date)](https://star-history.com/#InvolutionHell/involutionhell&Date)

## 📜 License & Copyright

This project is **dual-licensed** — code and content are licensed separately.

| Part                                                                                   | License                            | File                                 |
| -------------------------------------------------------------------------------------- | ---------------------------------- | ------------------------------------ |
| **Code** (the software powering the site: `app/`, `lib/`, components, scripts, config) | [Apache License 2.0](LICENSE)      | [`LICENSE`](LICENSE)                 |
| **Content** (articles/docs under `content/docs/`)                                      | [CC BY-NC-SA 4.0](LICENSE-CONTENT) | [`LICENSE-CONTENT`](LICENSE-CONTENT) |

### Codebase (Apache-2.0)

The **software** that builds and runs this site is open source under the [Apache License 2.0](LICENSE) — use, modify, and redistribute freely (including commercially), keeping the copyright and NOTICE.

### Documentation content (CC BY-NC-SA 4.0)

The **articles and docs** under `content/docs/` are licensed under [CC BY-NC-SA 4.0](LICENSE-CONTENT): share and adapt for **non-commercial** purposes with attribution, distributing derivatives under the same license. **Commercial use requires separate permission.**

### Shared Content

The copyright of **articles, comments, and other contributed content** remains with the original authors and contributors:

1. Unless otherwise noted by the original author, contributed content defaults to the same CC BY-NC-SA 4.0 terms above.
2. Commercial reuse or derivative works still require explicit permission from the author.
3. We cannot individually verify every submission for originality or legality.

If your rights are infringed, please **[open an issue](https://github.com/InvolutionHell/involutionhell/issues/new)**. We will review and take appropriate action (removal, blocking, etc.) promptly.
