---
title: Prompt Repetition Improves Non-Reasoning LLMs
description: 复读机或可提高大模型能力
date: "2026-03-05"
tags:
  - AI
  - LLMs
  - arXiv
docId: l6eepr5ctjgrhdgupy3twr1t
lang: zh
translatedFrom: en
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

&lt;https://arxiv.org/pdf/2512.14982&gt;

在不使用推理模式的情况下，重复输入提示词能够提升主流模型（Gemini、GPT、Claude、DeepSeek）的表现，且不会增加生成 token 数量或推理延迟。

1. 提示词重复：LLM 通常以因果语言模型的方式训练，即过去的 token 无法关注到未来的 token。因此，用户查询中 token 的排列顺序会影响预测性能。例如，"选项在前、问题在后"的查询形式与"问题在前、选项在后"的形式往往表现不同（见图 1）。我们提出重复提示词的方法：将输入从单次提示词转换为重复两次的形式。这使得每个提示词 token 都能关注到其他所有提示词 token，从而解决上述问题。在不使用推理模式时，提示词重复能够提升 LLM 的性能（图 1），且不会增加生成输出的长度或推理延迟。
