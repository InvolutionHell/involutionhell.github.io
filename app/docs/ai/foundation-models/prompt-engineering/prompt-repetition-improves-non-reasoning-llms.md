---
title: Prompt Repetition Improves Non-Reasoning LLMs
description: 复读机或可提高大模型能力
date: "2026-03-05"
tags:
  - AI
  - LLMs
  - arXiv
docId: l6eepr5ctjgrhdgupy3twr1t
---

&lt;https://arxiv.org/pdf/2512.14982&gt;

When not using reasoning, repeating the input prompt improves performance for popular models (Gemini, GPT, Claude, and Deepseek) without increasing the number of generated tokens or latency.

1. Prompt Repetition LLMs are often trained as causal language models, i.e. past tokens cannot attend to future tokens. Therefore, the order of the tokens in a user’s query can affect prediction performance. For example, a query of the form “ ” often performs differently from a query of the form “ ” (see options-first vs. question-first in Figure 1). We propose to repeat the prompt, i.e. transform the input from “ ” to “ ”. This enables each prompt token to attend to every other prompt token, addressing the above. When not using reasoning, prompt repetition improves the performance of LLMs (Figure 1) without increasing the lengths of the generated outputs or latency
