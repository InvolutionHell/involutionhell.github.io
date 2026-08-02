---
title: "2582. 递枕头"
description: "LeetCode 2582. 递枕头 题解 — 数学规律题，核心技巧是利用 n 个人传枕头时每轮间隔为 n-1，通过 time // (n-1) 计算完整轮次，再根据轮次奇偶性判断正向或反向传递位置。适合正在刷 LeetCode 数学模拟类题目的求职者与算法学习者。"
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - math
  - simulation
abbrlink: 82e09f92
docId: p9gvb8klqv990cq88j4l76zy
---

# topic：

[2582.Pillow.md](https://leetcode-cn.com/problems/di-zhen-tou/)

# Thought：

math题，Find a rule，npersonal，interval=n-1，The number of cycles in the crowd= $time // (n-1)$，The number of cycles is2The number of times from scratch，Otherwise, the number of forwards from the back。

# Code：

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
