---
title: 2562.Find the series of the array
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
