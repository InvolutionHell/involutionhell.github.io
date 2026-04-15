---
title: "345. Reverse Vowels of a String"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: 1c57c22c
docId: udm0daiek9dr22xq4doep5w4
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[345. Reverse Vowels of a String](https://leetcode.cn/problems/reverse-vowels-of-a-string/description/)

# Approach

Wrote two methods. After checking Gongshui Sanye's hints, I realized this can be solved with two pointers — check whether the characters at both ends are vowels. Two improved versions below.

# Code

```python Two pointers
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
