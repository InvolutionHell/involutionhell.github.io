---
title: context engineering 快速了解
description: ""
date: "2025-10-03"
tags:
  - context-engineering
  - prompt-engineering
  - llm-fundamentals
docId: wdqqrepoy43jiieyyjmaekk1
---

# context engineering 快速了解

## 一些基本概念

解决问题：

- 大多数模型的context window 非常有限
- 输入信息杂乱影响模型理解
- 输入越多，成本越高（token太贵了）

context ：模型输入。用户问题，背景信息，相关资料，可用工具列表，工具执行结果，历史对话等——模型基于这些内容来生成答案

context window：模型输入容量上限。模型输入中最多能包含的token数量，例如Gemini 2.5 pro 的context window 是100万，代表其能处理100万的token输入。

context engineering：精心设计给模型的输入内容。让模型在有限的context window内尽可理解的更准，答的更好，花的更少。

我们经常遇见的大模型会遗忘我们输入的信息就是因为context window大小受限。

context engineering 对于agent的构建非常重要。

## 实现方法

### 保存context

比较典型的例子是gpt的长记忆功能。

用一个数据库/硬盘等存储我们想要模型记住的上下文信息。

### 选择context

从海量信息里选择与用户提问最相关的信息。

静态选择：例如指导模型回答问题的系统prompt，确保模型输出安全可靠输出。—-必须放入context

动态选择：选择与用户问题最相关的内容，例如gpt从长记忆库里面挑选内容放入context，例如agent选择与当前任务相关的工具来调用。

rag是一种动态选择实现的工具。

### 压缩context

context里面最占空间的两类数据：模型输出文本，工具执行结果

Claude code 4 的实践：每当上下文到一定的数量，就执行auto- compact。扔到本身的信息，只在context里面保存对原本信息的总结。

### 隔离context

通常出现在multi agent 场景

Anthropic的实践：

![Anthropic的实践](https://img.coly.cc/obs-img/2025/10/7110909d5366ba7747f037ae9300f7bc.png)

不同agent有自己独立的工具，独立的运行历史，独立的记忆体系。

这些agent的context是互相独立的。

### 进一步学习

langchain—context engineering http://blog.langchain.com/context-engineering-for-agents/

cognition: https://cognition.ai/blog/dont-build-multi-agents
