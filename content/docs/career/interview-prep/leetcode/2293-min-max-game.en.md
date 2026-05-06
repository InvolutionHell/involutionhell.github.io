---
title: "2293. Min Max Game — Daily Problem"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - solved
    - answer
abbrlink: 9df6242c
category: null
docId: mssz5wgh368yp55qcvs1op5e
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

Although it's a simple problem, it involves a recursive idea.

The approach is to continuously convert the 1D list into a 2D list for processing (this avoids index confusion caused by in-place changes), then use a `flag` counter to compare maximum and minimum values.

At the end, return the only remaining number — though we know it must be `nums[0]` by this point, we still use `nums[0]` to avoid warnings.

```python
class Solution:
    def minMaxGame(self, nums: List[int]) -> int:
        flag = 0
        while len(nums) > 1:
            nums = [nums[i:i + 2] for i in range(0, len(nums), 2)]
            # split into 2D
            for i in range(len(nums)):
                if flag % 2 == 0:
                    nums[i] = min(nums[i])
                    flag += 1
                else:
                    nums[i] = max(nums[i])
                    flag += 1
        return nums[0]

```
