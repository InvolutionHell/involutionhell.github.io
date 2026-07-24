---
title: "LeetCode Solution Manager：本地题解管理工具"
description: "一个用于创建、整理和追踪个人 LeetCode Python 题解的轻量命令行工具。"
date: "2026-07-24"
tags:
  - "LeetCode"
  - "Python"
  - "CLI"
  - "算法"
---

# LeetCode Solution Manager

一个用于创建、整理和追踪个人 LeetCode Python 题解的轻量命令行工具。

项目地址：[GitHub](https://github.com/richardkkk/leetcode-solution-manager)

## 功能

* 根据题号创建 Python 解题文件，并记录题目元数据。
* 用 solve 标记一个或多个已完成题目，自动生成进度报告。
* 用 check 检查题解文件、登记记录和进度报告是否一致。
* 支持归档、移除题目，以及安全刷新自动生成的内容。
* progress.md 中可直接点击题目标题打开本地题解，或通过 Problem 链接跳转到对应题目页面。

## 快速开始

```powershell
git clone https://github.com/richardkkk/leetcode-solution-manager.git
cd leetcode-solution-manager
python manage.py add 189
python manage.py solve 189
```

个人题解、problems.json 和 progress.md 默认不会被提交到工具仓库；如需在自己的仓库中追踪它们，可按 README 的说明调整 .gitignore。

## 说明

这是一个非官方的个人学习管理工具。用户主动执行需要题目资料的命令时，工具会向 LeetCode 端点发送请求；使用者应自行遵守适用的平台条款和政策。
