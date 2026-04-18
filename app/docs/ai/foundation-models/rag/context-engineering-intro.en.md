---
title: A Quick Introduction to Context Engineering
description: ""
date: "2025-10-03"
tags:
  - context-engineering
  - prompt-engineering
  - llm-fundamentals
docId: wdqqrepoy43jiieyyjmaekk1
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# A Quick Introduction to Context Engineering

## Key Concepts

Problems it addresses:

- Most models have a very limited context window
- Noisy, poorly organized inputs hurt model understanding
- More input = higher cost (tokens are expensive)

**Context**: Everything fed to the model as input — the user's question, background information, reference material, available tools, tool execution results, conversation history, and so on. The model generates answers based on all of this.

**Context window**: The maximum amount of input a model can process. Measured in tokens — for example, Gemini 2.5 Pro has a 1 million token context window, meaning it can handle up to 1 million tokens of input at once.

**Context engineering**: The deliberate design of what goes into the model's input. The goal is to help the model understand more accurately, respond better, and spend fewer tokens — all within a limited context window.

The common experience of LLMs "forgetting" earlier parts of a conversation happens precisely because of context window size limits.

Context engineering is especially important when building agents.

## Approaches

### Saving Context

A classic example is ChatGPT's long-term memory feature.

Store the context you want the model to remember in a database or on disk, and retrieve it when needed.

### Selecting Context

Choose the most relevant information from a large pool of data to include in the model's input.

**Static selection**: Content that always goes into the context — for example, a system prompt that guides the model's behavior and ensures safe, reliable outputs.

**Dynamic selection**: Content chosen based on what's most relevant to the current query — for example, pulling entries from a long-term memory store in ChatGPT, or an agent selecting which tools to include based on the current task.

RAG is one implementation of dynamic selection.

### Compressing Context

The two biggest space consumers in a context are model-generated text and tool execution results.

One practice from Claude Code: when the context reaches a certain size, it runs auto-compact — discarding raw content and keeping only a summary of what was there.

### Isolating Context

This typically comes up in multi-agent scenarios.

Anthropic's approach:

![Anthropic's approach](https://img.coly.cc/obs-img/2025/10/7110909d5366ba7747f037ae9300f7bc.png)

Different agents each have their own dedicated tools, independent execution histories, and separate memory systems. Their contexts remain isolated from one another.

### Further Reading

LangChain — Context Engineering: http://blog.langchain.com/context-engineering-for-agents/

Cognition: https://cognition.ai/blog/dont-build-multi-agents
