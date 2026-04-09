---
title: 2270. Number of Ways to Split Array.md
date: "2025/1/14-9:31"
tags:
  - - Python
  - - Answer
abbrlink: c25bb550
docId: a6inw303oslb7i5tcqj5xxx4
---

# QUESTION：

[2270. Number of Ways to Split Array.md](https://leetcode.cn/problems/number-of-ways-to-split-array/description/)

# My Think：

`2 <= nums.length <= 105`, 因此我们可以直接获取到第一个数字, 初始状态就在指针于index0, 正要往index1走的时候.
然后只需要一次For循环就可以搞定

重点是第二个方法, 来自题解.

# Code：

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
