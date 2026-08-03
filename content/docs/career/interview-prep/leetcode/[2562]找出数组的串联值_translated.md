---
title: "2562. 找出数组的串联值"
description: "LeetCode 2562. 找出数组的串联值 题解 — 使用双指针技巧从数组两端逐步取出数字并拼接为串联值，关键点在于正确处理正负索引的转换关系，避免越界错误。适合正在刷 LeetCode 双指针题型、需要巩固数组索引边界处理的求职者和算法学习者。"
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - Array
  - Double pointer
  - simulation
abbrlink: b625a0e1
docId: naxatag8x2nnvkhbwdfc1azc
---

# topic：

[2562.Find the series of the array.md](https://leetcode-cn.com/problems/find-the-concatenation-of-an-array/)

# Thought：

This question andquiz4very similar，都是Double pointer。
I made a mistake when I did this question，When calculating the right pointer, the negative index is calculated`right = -left + 1`，It is difficult to calculate the relationship between positive indexes，So replaced`right = len(nums) - 1 - left`。

# Code：

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
