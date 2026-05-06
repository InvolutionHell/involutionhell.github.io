---
title: 2582.Pillow
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
