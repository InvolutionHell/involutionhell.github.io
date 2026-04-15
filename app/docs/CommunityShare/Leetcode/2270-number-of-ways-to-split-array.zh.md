---
title: "2270. 分割数组的方案数"
date: "2025/1/14-9:31"
tags:
  - - Python
  - - Answer
abbrlink: c25bb550
docId: a6inw303oslb7i5tcqj5xxx4
lang: zh
translatedFrom: en
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# 题目

[2270. 分割数组的方案数](https://leetcode.cn/problems/number-of-ways-to-split-array/description/)

# 思路

`2 <= nums.length <= 10^5`，因此我们可以直接获取第一个数字，初始状态指针位于 index 0，正要往 index 1 走的时候。然后只需要一次 for 循环就可以搞定。

重点是第二个方法，来自题解。

# 代码

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
