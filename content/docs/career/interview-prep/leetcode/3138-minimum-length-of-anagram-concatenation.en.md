---
title: "3138. Minimum Length of Anagram Concatenation"
description: "LeetCode 3138. Minimum Length of Anagram Concatenation — solution by enumerating substring lengths and using a hash map to verify whether the string can be formed by concatenating anagrams. The core technique is using character frequency arrays to check whether the substring's repeat multiplier matches the original string. Suitable for job seekers preparing for coding assessments and interviews who want to strengthen skills in string and counting algorithms."
date: 20/12/2024
tags:
  - Python
  - Prefix Sum
  - Hash Table
  - String
  - Counting
abbrlink: d1339d55
docId: o3knuvbpnki6isfjv3g5ohau
lang: en
translatedFrom: zh
translatedAt: 2026-05-11T00:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem Description

https://leetcode.cn/problems/minimum-length-of-anagram-concatenation/description/?envType=daily-question&envId=2024-12-20

You are given a string `s`, which is known to be a concatenation of anagrams of some string `t`.

Return the minimum possible length of the string `t`.

An anagram is formed by rearranging the letters of a string. For example, "aab", "aba", and "baa" are all anagrams of "aab".

#### Example 1:

    Input: s = "abba"

    Output: 2

    Explanation:

    One possible string t is "ba".

#### Example 2:

    Input: s = "cdef"

    Output: 4

    Explanation:

    One possible string t is "cdef". Note that t can equal s.

# Approach

Since the problem naturally suggests using a counting method (`Counter`), we need to find the minimum substring for each string. For example, for `abba`, the result is `ab`; for `cdef`, it's `cdef`.
We iterate from length `1` (a single character) onwards, slicing the string to get the current substring.

Initially, we compute the character count for the original string using `Counter`, which gives us a dictionary of character frequencies.
Next, we only need to check if the count of each character in the current substring multiplied by `n/k` equals the count in the original string (i.e., whether repeating the current substring x times equals the original string).

# Code

```python
import collections
class Solution:
    def minAnagramLength(self, s: str) -> int:
        def check(k: int) -> bool:
            # 遍历字符串 s，每次取长度为 k 的子串
            # Iterate over the string `s`, taking substrings of length `k`
            for i in range(0, n, k):
                # 统计每个字符出现的次数
                # Count the occurrences of each character in the current substring
                cnt1 = collections.Counter(s[i: i + k])
                for c, v in cnt.items():
                    # 如果每个字符出现的次数乘以 n/k != cnt[] return False
                    # If the count of any character multiplied by (n // k) != the original count, return False
                    if cnt1[c] * (n // k) != v:
                        return False
            return True

        cnt = collections.Counter(s)
        n = len(s)
        for i in range(1, n+1):
            if n % i == 0 and check(i):
                return i
```
