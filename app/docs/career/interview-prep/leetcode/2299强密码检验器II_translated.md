---
title: One question daily 2299. Code inspection device II
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - Bit operation
abbrlink: 7ded25bb
docId: fxn6bn619g3a9l98l9vggpg1
---

Excess when executing100%User，What can I say about this question，But one**Bit operation**Knowledge point

# My code：

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

# Bit operation代码：

method one：simulation + Bit operation

According to the description of the topic，我们可以simulation检查密码是否满足题目要求的过程。

first，We check whether the length of the password is less than 8，in the case of，Then return false。

Next，We use a mask mask To record whether the password contains a lowercase letter、uppercase letter、Numbers and special characters。We traverse the password，Like a character every time，First determine whether it is the same as the previous character，in the case of，Then return false。Then，Update mask according to the type of character mask。at last，We check the mask mask Whether it is 15，in the case of，Then return true，否Then return false。

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

author：ylb
Link：https://leetcode.cn/problems/strong-password-checker-ii/solutions/2068878/by-lcbin-hk2a/
