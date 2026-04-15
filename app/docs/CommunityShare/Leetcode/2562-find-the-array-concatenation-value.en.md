---
title: "2562. Find the Array Concatenation Value"
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - Array
  - Two Pointers
  - simulation
abbrlink: b625a0e1
docId: naxatag8x2nnvkhbwdfc1azc
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[2562. Find the Array Concatenation Value](https://leetcode-cn.com/problems/find-the-concatenation-of-an-array/)

# Approach

This problem is very similar to quiz 4 — both use two pointers.

I made a mistake when computing the right pointer using a negative index: `right = -left + 1`. It's tricky to reason about with positive indices, so I switched to `right = len(nums) - 1 - left`.

# Code

```python
class Solution:
    def findTheArrayConcVal(self, nums: List[int]) -> int:
        sums = 0
        for left in range(len(nums)):
            right = len(nums) - 1 - left
            if left == right:
                sums += nums[left]
                break
            elif left < right:
                sums += int(str(nums[left]) + str(nums[right]))
        return sums
```
