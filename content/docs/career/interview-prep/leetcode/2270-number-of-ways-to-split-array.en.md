---
title: "2270. Number of Ways to Split Array"
description: "LeetCode 2270. Number of Ways to Split Array — solution using prefix sums and a single traversal to count valid split points. The core technique is maintaining left and right subarray sums and comparing whether the left side is greater than or equal to the right. Suitable for job seekers and beginners practicing array interval sum problems."
date: "2025/1/14-9:31"
tags:
  - - Python
  - - Answer
abbrlink: c25bb550
docId: a6inw303oslb7i5tcqj5xxx4
lang: en
translatedFrom: zh
translatedAt: 2026-05-11T00:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[2270. Number of Ways to Split Array](https://leetcode.cn/problems/number-of-ways-to-split-array/description/)

# Approach

`2 <= nums.length <= 10^5`, so we can directly take the first element. The initial state has the pointer at index 0, about to move to index 1. A single `for` loop is all we need.

The second method is the key one — taken from the editorial.

# Code

```python
class Solution:
    def waysToSplitArray(self, nums: List[int]) -> int:
        temp_sum = nums[0]
        total_sum = sum(nums) - temp_sum
        ans = 0
        for i in range(1, len(nums)):
            if temp_sum >= total_sum:
                ans += 1
            temp_sum += nums[i]
            total_sum -= nums[i]
        return ans
```

```python
t = (sum(nums) + 1) // 2
return sum(s >= t for s in accumulate(nums[:-1]))
```
