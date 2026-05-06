---
title: One question daily 2293. Great mini game
date: "2024.01.01 0:00"
tags:
  - - Python
  - - solved
    - answer
abbrlink: 9df6242c
category: null
docId: mssz5wgh368yp55qcvs1op5e
---

Although it is a simple question，But there are recursive ideas。

Constantly convert the one -dimensional list into a two -dimensional list for operation（This can be avoidedindexChaos caused by changes）

Then useflagCount，Comparison of maximum and minimum values。

Just return to the end，Although it must be returned to a number，Still‘nums[0]’To avoid warning。

```html
2293. Great mini game Simple 39 company Google Google Give you a bidding 0
Started integer array nums ，Its length is 2 Power。 right nums Execute the
following algorithm： set up n equal nums length，if n == 1 ，termination
Algorithm。otherwise，create A new integer array newNums ，The length of the new
array is n / 2 ，Bidding from 0 start。 right于满足 0 <= i < n / 2 Every even
Bidding i ，Will newNums[i] Assignment for min(nums[2 * i], nums[2 * i + 1]) 。
right于满足 0 <= i < n / 2 Every odd number Bidding i ，Will newNums[i]
Assignment for max(nums[2 * i], nums[2 * i + 1]) 。 use newNums replace nums 。
From steps 1 start repeat the whole process。 After executing the
algorithm，return nums The remaining numbers。 Exemplary example 1： enter：nums
= [1,3,5,2,4,8,2,2] Output：1 explain：repeat执行算法会得到下述数组。 first
round：nums = [1,5,4,2] second round：nums = [1,4] Third round：nums = [1] 1 Is
the last number left，return 1 。 Exemplary example 2： enter：nums = [3]
Output：3 explain：3 Is the last number left，return 3 。 hint： 1 <=
nums.length <= 1024 1 <= nums[i] <= 109 nums.length yes 2 Power
```

```python
class Solution:
    def minMaxGame(self, nums: List[int]) -> int:
        flag = 0
        while len(nums) > 1:
            nums = [nums[i:i + 2] for i in range(0, len(nums), 2)]
            # Divide2dimension
            for i in range(len(nums)):
                if flag % 2 == 0:
                    nums[i] = min(nums[i])
                    flag += 1
                else:
                    nums[i] = max(nums[i])
                    flag += 1
        return nums[0]

```
