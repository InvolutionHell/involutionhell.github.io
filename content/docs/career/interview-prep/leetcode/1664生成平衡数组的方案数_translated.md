---
title: 1664. Number of schemes to generate balance numbers One question daily
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - Dynamic planning
  - - One question daily
abbrlink: 1978f474
docId: ska0npc89ja1r4pdt2qow79u
---

[1664. Number of schemes to generate balance numbers](https://leetcode.cn/problems/ways-to-make-a-fair-array/description/?orderBy=most_relevant)

# Thought：

See when you read the question medium I know that it is definitely not really going to delete an element。Otherwise it will time out，So I tried to try polepythonFeature code：Use slice to process all data；
But it's timeout。。

然后看官方answer，用的Dynamic planning。中心Thought是：

> General nature，Now we will settle down i Delete elements，
> Obviously the bidding i The previous element bidding will not change from this，Bidding i
> The original was originally j，j>iThe array elements of the bid will move to the bidding j−1，
> Immediately bidding i The subsequent bidding elements will become the rated element，
> The even bidding element will become a strange number of bidding elements。

# Code

```python slice
class Solution:
    def waysToMakeFair(self, nums: List[int]) -> int:
        flag = 0
        for i in range(len(nums)):
            temp_nums = nums[:i] + nums[i+1:]
            if sum(temp_nums[::2])==sum(temp_nums[1::2]):
                flag += 1
        return flag
```

```python 官方answer
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
