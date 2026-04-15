---
title: "213. House Robber II"
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - Array
  - Dynamic planning
abbrlink: 85beb0bf
docId: rv6egbynttb4mt1n0412bue0
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[213. House Robber II](https://leetcode-cn.com/problems/house-robber-ii/)

# Approach

This time I finally understand dynamic programming a bit better. At first I thought we needed to decide where to start — rob the first or skip to the second (that's the difference from House Robber I). But actually the smallest subproblem is the same as House Robber I: whether to rob the current house.

We define a `dp` array where `dp[i]` represents the maximum profit when we've considered up to house `i`. If we rob the current house: `dp[i] = dp[i-2] + nums[i]` (we can't rob the house immediately before). If we don't: `dp[i] = dp[i-1]`.

State transition: `dp[i] = max(dp[i-2] + nums[i], dp[i-1])`.

Finally, since the houses form a circle, we split into two cases: rob starting from house 1 (skip the last), or starting from house 2 (skip the first).

# Code

```python
class Solution:
    def rob(self, nums: List[int]) -> int:
        def rob1(nums: List[int]) -> int:
            if len(nums) == 1:
                return nums[0]
            ans = 0
            dp = [0] * len(nums)
            # def: dp[i] represents the max profit when robbing up to house i
            # rob house i: dp[i-2] + nums[i]; don't rob: dp[i-1]
            for i in range(len(nums)):
                dp[i] = max(dp[i - 2] + nums[i], dp[i - 1])
                ans = max(ans, dp[i])
            return ans
        # rob starting from house 1, or starting from house 2
        return max(rob1(nums[:-1]), rob1(nums[1:])) if len(nums) != 1 else nums[0]
```
