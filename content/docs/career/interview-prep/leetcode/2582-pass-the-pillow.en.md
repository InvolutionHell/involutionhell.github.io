---
title: "2582. Pass the Pillow"
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - math
  - simulation
abbrlink: 82e09f92
docId: p9gvb8klqv990cq88j4l76zy
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[2582. Pass the Pillow](https://leetcode-cn.com/problems/pass-the-pillow/)

# Approach

Math problem — find the pattern. With `n` people, the period is `n-1`. Number of full cycles = $\lfloor time / (n-1) \rfloor$. If the number of full cycles is even, the pillow moves forward from the start; otherwise, it moves backward from the end.

# Code

```python
class Solution:
    def passThePillow(self, n: int, time: int) -> int:
        if n > time:
            return time + 1
        if time // (n-1) % 2 == 0:
            return time % (n-1) + 1
        else:
            return n - time % (n-1)
```
