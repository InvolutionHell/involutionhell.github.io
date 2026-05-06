---
title: "1664. Ways to Make a Fair Array — Daily Problem"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - Dynamic programming
  - - Daily problem
abbrlink: 1978f474
docId: ska0npc89ja1r4pdt2qow79u
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

[1664. Ways to Make a Fair Array](https://leetcode.cn/problems/ways-to-make-a-fair-array/description/?orderBy=most_relevant)

# Approach

When reading the problem, I immediately knew we shouldn't actually delete elements one by one — that would time out. So I tried a "pure Python" approach using slices to process all the data, but it still timed out.

Then I checked the official solution, which uses dynamic programming. The key insight is:

> In general, suppose we delete element at index `i`.
> Obviously, elements before index `i` remain unchanged.
> Elements originally at index `j` where `j > i` shift to index `j − 1`.
> Therefore, elements after index `i` that were at even indices become odd, and vice versa.

# Code

```python slice approach (TLE)
class Solution:
    def waysToMakeFair(self, nums: List[int]) -> int:
        flag = 0
        for i in range(len(nums)):
            temp_nums = nums[:i] + nums[i+1:]
            if sum(temp_nums[::2])==sum(temp_nums[1::2]):
                flag += 1
        return flag
```

```python official solution
class Solution:
    def waysToMakeFair(self, nums: List[int]) -> int:
        res = odd1 = even1 = odd2 = even2 = 0
        for i, num in enumerate(nums):
            if i & 1:
                odd2 += num
            else:
                even2 += num
        for i, num in enumerate(nums):
            if i & 1:
                odd2 -= num
            else:
                even2 -= num
            if odd1 + even2 == odd2 + even1:
                res += 1
            if i & 1:
                odd1 += num
            else:
                even1 += num
        return res
```
