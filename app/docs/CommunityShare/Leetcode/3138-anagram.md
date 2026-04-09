---
title: 3138. Minimum Length of Anagram Concatenation.md
date: 20/12/2024
tags:
  - Python
  - Prefix Sum
  - Hash Table
  - String
  - Counting
abbrlink: d1339d55
docId: o3knuvbpnki6isfjv3g5ohau
---

# Description:

https://leetcode.cn/problems/minimum-length-of-anagram-concatenation/description/?envType=daily-question&envId=2024-12-20
You are given a string `s`, which is known to be a concatenation of anagrams of some string `t`.

Return the minimum possible length of the string `t`.

An anagram is formed by rearranging the letters of a string. For example, "aab", "aba", and, "baa" are anagrams of "aab".

#### Example 1:

    Input: s = "abba"

    Output: 2

    Explanation:

    One possible string t could be "ba".

#### Example 2:

    Input: s = "cdef"

    Output: 4

    Explanation:

    One possible string t could be "cdef", notice that t can be equal to s.

# Thinking:

Since the problem naturally suggests using a counting method (`Counter`), we need to find the minimum substring for each string. For example, for `abba`, the result is `ab`; for `cdef`, it's `cdef`.
We iterate from length `1` (a single character) onwards, slicing the string to get the current substring.

Initially, we compute the character count for the original string using `Counter`, which gives us a dictionary of character frequencies.
Next, we only need to check if the count of each character in the current substring multiplied by `n/k` equals the count in the original string (i.e., whether repeating the current substring x times equals the original string).

由于题意很容易联想到这道题要进行计数(Counter). 我们需要找到每个字符串的最小子串，`abba`为`ab`, `cdef`为`cdef`. 于是我们从长度0（即单个字符）开始遍历，期间通过切片的形式来获取当前子串。
因为最开始我们对原始字符串进行了Counter，得到了字符数量和字符对应的字典。接下来我们只需要判断当前子串的Counter到的某个字符的数值乘以`n/k`是否等于原始字符串的Counter的值即可（即当前子串乘以x倍是否等于源字符串）。

# Code:

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
