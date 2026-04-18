---
title: "2490. Circular Sentence"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - String
abbrlink: 5c07686c
docId: pe6o8l76945uo7aqv79ddhii
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[2490. Circular Sentence](https://leetcode.cn/problems/circular-sentence/)

# Approach

Split each word, then concatenate the sentence with itself (e.g., `"abc"` → `"abcabc"`). Check whether the last character of each word equals the first character of the next word (wrapping around).

# Code

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
