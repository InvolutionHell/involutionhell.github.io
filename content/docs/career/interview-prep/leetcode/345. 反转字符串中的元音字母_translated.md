---
title: 345. Voice letter in the reverse string.md
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: 1c57c22c
docId: udm0daiek9dr22xq4doep5w4
---

# topic：

[345. Voice letter in the reverse string.md](https://leetcode.cn/problems/reverse-vowels-of-a-string/description/)

# Thought：

Write two methods，Watch the reminder of the three leaves of the palace water，Can be made with dual pointers，See if both the elements of both ends are vowel letters。 Improved two editions。

# Code：

```python Double pointer
class Solution:
    def reverseVowels(self, s: str) -> str:
        vowels = 'aeiouAEIOU'
        start = 0
        end = len(s) - 1
        while start < end:
            while s[end] not in vowels and start < end:
                end -= 1
            while s[start] not in vowels and start < end:
                start += 1
            if s[start] in vowels and s[end] in vowels:
                s[start], s[end] = s[end], s[start]
                start += 1
                end -= 1
        return ''.join(s)
```

```python String operation
class Solution:
    def reverseVowels(self, s: str) -> str:
        s = list(s)
        vowels = 'aeiouAEIOU'
        ans = []
        for i in s:
            if i in vowels:
                ans.append(i)
        a = ''
        for i in range(len(s)):
            if s[i] in vowels:
                a += ans.pop()
            else:
                a += s[i]
        return ''.join(a)
```
