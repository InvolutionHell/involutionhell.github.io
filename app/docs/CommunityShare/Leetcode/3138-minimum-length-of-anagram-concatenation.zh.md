---
title: "3138. 同位字符串连接的最小长度"
date: 20/12/2024
tags:
  - Python
  - Prefix Sum
  - Hash Table
  - String
  - Counting
abbrlink: d1339d55
docId: o3knuvbpnki6isfjv3g5ohau
lang: zh
translatedFrom: en
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# 题目描述

https://leetcode.cn/problems/minimum-length-of-anagram-concatenation/description/?envType=daily-question&envId=2024-12-20

给你一个字符串 `s`，已知它是某个字符串 `t` 的若干个同位字符串的串联。

返回字符串 `t` 的最小可能长度。

同位字符串是由重新排列字母形成的字符串。例如，"aab"、"aba" 和 "baa" 都是 "aab" 的同位字符串。

#### 示例 1：

    输入：s = "abba"

    输出：2

    解释：

    t 的一个可能的字符串是 "ba"。

#### 示例 2：

    输入：s = "cdef"

    输出：4

    解释：

    t 的一个可能的字符串是 "cdef"，注意 t 可以等于 s。

# 思路

由于题意很容易联想到这道题要进行计数（`Counter`），我们需要找到每个字符串的最小子串。例如 `abba` 的最小子串是 `ab`；`cdef` 是 `cdef`。

我们从长度 1（即单个字符）开始遍历，通过切片获取当前子串。

最开始对原始字符串进行 `Counter`，得到字符数量字典。接下来只需判断当前子串中某个字符的计数乘以 `n/k` 是否等于原始字符串的计数（即当前子串乘以 x 倍是否等于原始字符串）。

Since the problem naturally suggests using a counting method (`Counter`), we need to find the minimum substring for each string. For example, for `abba`, the result is `ab`; for `cdef`, it's `cdef`.
We iterate from length `1` (a single character) onwards, slicing the string to get the current substring.

Initially, we compute the character count for the original string using `Counter`, which gives us a dictionary of character frequencies.
Next, we only need to check if the count of each character in the current substring multiplied by `n/k` equals the count in the original string (i.e., whether repeating the current substring x times equals the original string).

# 代码

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
