---
title: 1004.Maximum continuity1Number III Maximum continuity1Number III
date: "2022.12.07-01:15"
tags:
  - - Python
  - - solved
    - answer
abbrlink: ed19b576
docId: ytg2bds2dnhzw37nrb3vassy
---

Today's daily question is too difficult，So find the problem by yourself。Today's question is a hash table+Sliding window algorithm，虽然感觉只用了Sliding window algorithm。

```python

class Solution:
    def longestOnes(self, nums: List[int], k: int) -> int:
        k_mean = k
        # Used to record how many arrays there are now
        flag = 0
        # Used to record the maximum land number
        max_flag = 0
        for start in range(len(nums)):
            tail = start
            while k >= 0 and tail <= len(nums) - 1:
                if nums[tail] == 1:
                    tail += 1
                    flag += 1
                elif nums[tail] == 0 and k > 0:
                    tail += 1
                    k -= 1
                    flag += 1
                elif nums[tail] == 0 and k == 0:
                    k = k_mean
                    max_flag = max(max_flag, flag)
                    flag = 0
                    break
                if tail == len(nums):
                    max_flag = max(max_flag, flag)
                    flag = 0
                    break
        return max_flag
```

This is my approach at the beginning，Although the double pointer is used，But there is no flexibility，Very empty feeling，Very dry slide。
the following[@Lincoln](/u/lincoln)@Lincoln Big practice，Just as one record of yourself，不作为我的answer发表

```
class Solution:
    def longestOnes(self, nums: List[int], k: int) -> int:
        """
        Thinking：1. k=0It can be understood as the problem of the maximum duplication sub -string
             2. If the current window value-In the window1Number <= k: Then expand the window(right+1)
                If the current window value-In the window1Number > k: Swipe the window to the right(left+1)
        method：Hash table + Sliding window
        """
        n = len(nums)
        o_res = 0
        left = right = 0
        while right < n:
            if nums[right]== 1: o_res += 1
            if right-left+1- o_res > k:
                if nums[left]== 1: o_res -= 1
                left += 1
            right += 1
        return right - left
```

Look atLincolnBigThinking，very clearly，remember
