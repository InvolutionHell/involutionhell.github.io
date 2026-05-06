---
title: "1004. Max Consecutive Ones III"
date: "2022.12.07-01:15"
tags:
  - - Python
  - - solved
    - answer
abbrlink: ed19b576
docId: ytg2bds2dnhzw37nrb3vassy
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

Today's daily problem was too hard, so I picked one myself. The approach is hash table + sliding window, though it feels like only sliding window was really used.

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

This was my initial approach. Although it uses two pointers, it lacks flexibility — feels very stiff.

The following is from [@Lincoln](/u/lincoln), recorded here purely as a personal note, not presented as my own answer.

```
class Solution:
    def longestOnes(self, nums: List[int], k: int) -> int:
        """
        Idea: 1. k=0 can be understood as finding the longest substring without duplicates
             2. If (current window size - number of 1s in window) <= k: expand the window (right+1)
                If (current window size - number of 1s in window) > k: slide the window right (left+1)
        Method: Hash table + Sliding window
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

Lincoln's thinking is very clear — worth remembering.
