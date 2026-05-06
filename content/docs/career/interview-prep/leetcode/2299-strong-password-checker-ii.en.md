---
title: "2299. Strong Password Checker II — Daily Problem"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - Bit operation
abbrlink: 7ded25bb
docId: fxn6bn619g3a9l98l9vggpg1
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

Beat 100% of users on execution time. Not much to say about this problem except for one **bit manipulation** technique.

# My Code

```python
class Solution:
    def strongPasswordCheckerII(self, password: str) -> bool:
        flag1 = flag2 = flag3 = flag4 = 1
        ret = None
        for i in password:
            if ret == i:
                return False
            if i.isdigit():
                flag1 = 0
            elif i.isupper():
                flag2 = 0
            elif i.islower():
                flag3 = 0
            else:
                flag4 = 0
            ret = i
        if sum([flag1, flag2, flag3, flag4]) == 0 and len(password) >= 8:
            return True
        return False
```

# Bit Manipulation Code

**Method 1: Simulation + Bit Manipulation**

Based on the problem description, we simulate the process of checking whether a password meets the requirements.

First, check if the password length is less than 8 — if so, return `False`.

Then use a bitmask `mask` to track whether the password contains lowercase letters, uppercase letters, digits, and special characters. Traverse the password: for each character, first check if it's the same as the previous one — if so, return `False`. Then update `mask` based on the character type.

Finally, check whether `mask == 15` — if so, return `True`, otherwise return `False`.

```python
class Solution:
    def strongPasswordCheckerII(self, password: str) -> bool:
        if len(password) < 8:
            return False
        mask = 0
        for i, c in enumerate(password):
            if i and c == password[i - 1]:
                return False
            if c.islower():
                mask |= 1
            elif c.isupper():
                mask |= 2
            elif c.isdigit():
                mask |= 4
            else:
                mask |= 8
        return mask == 15
```

Author: ylb  
Link: https://leetcode.cn/problems/strong-password-checker-ii/solutions/2068878/by-lcbin-hk2a/
