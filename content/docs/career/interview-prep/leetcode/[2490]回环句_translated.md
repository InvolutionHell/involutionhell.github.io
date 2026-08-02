---
title: "2490. 回环句"
description: "LeetCode 2490. 回环句 题解 — 判断句子是否为回环句，核心解法为分割单词后检查每个单词末字母与下一单词首字母是否相同，涉及字符串分割与双指针遍历技巧。适合正在刷 LeetCode 字符串类题目的求职者与算法学习者。"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - String
abbrlink: 5c07686c
docId: pe6o8l76945uo7aqv79ddhii
---

# topic：

[[2490]Return ring sentence.md](https://leetcode.cn/problems/circular-sentence/)

# Thought：

Divide each word，Then stitch together（`123`Stitch`123123`），Determine whether the next word corresponding to each word meets whether the next word meets the same first。

# Code：

```python
class Solution:
    def isCircularSentence(self, sentence: str) -> bool:
        sentence = sentence.split(' ')
        length = len(sentence)
        sentence += sentence
        for i in range(0, length):
            if sentence[i][-1] != sentence[i+1][0]:
                return False
        return True
```
