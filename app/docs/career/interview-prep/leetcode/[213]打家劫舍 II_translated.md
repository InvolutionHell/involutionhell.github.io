---
title: 213.Hiccup II
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - Array
  - Dynamic planning
abbrlink: 85beb0bf
docId: rv6egbynttb4mt1n0412bue0
---

# topic：

[topic链接](https://leetcode-cn.com/problems/house-robber-ii/)

# Thought：

这一次终于懂一点Dynamic planning了，The first is the youngest problem，I first thought it was to consider where to start，Start from the first or the second one（这刚好是和Hiccup1Difference）。
但实际上最小子问题还是和Hiccup1Same：Whether to rob the current house。
First we set one`dp`Array，`dp[i]`Indicate robbery to the first`i`The maximum return when a house。
Then we rob the current house after we rob the current house `dp[i] = dp[i-2] + nums[i]`，(Because the house can not be robbed before the current house is robbed)，Do not rob the current house `dp[i] = dp[i-1]`。
So we can get the state transfer equation：`dp[i] = max(dp[i-2] + nums[i], dp[i-1])`。
Last classification discussion and robbery, the first or the second start。

# Code：

```python
class Solution:
    def rob(self, nums: List[int]) -> int:
        def rob1(nums: List[int]) -> int:
            if len(nums) == 1:
                return nums[0]
            ans = 0
            dp = [0] * len(nums)
            # def: dp[i]Express the robberyiHome
            # theft FirstiHouse，The income isdp[i-2]+nums[i], 不theftFirstiHouse，The income isdp[i-1]
            for i in range(len(nums)):
                dp[i] = max(dp[i - 2] + nums[i], dp[i - 1])
                ans = max(ans, dp[i])
            return ans
        # 打劫First一家，或者First二家开始
        return max(rob1(nums[:-1]), rob1(nums[1:])) if len(nums) != 1 else nums[0]
```
