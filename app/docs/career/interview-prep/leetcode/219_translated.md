---
title: 219.Existing duplicate elements II Hash table graphics
date: "2024.01.01 0:00"
categories:
  - - Python
    - Hash table
  - - solved
    - answer
tags:
  - - Python
  - - solved
abbrlink: 16b0e9f1
docId: k4btd9x3l3xnnl4dnr64d8cq
---

# Thought

This question was done on the phone at first，直接用的是双Hash table，An element，One depositindex，When a certain element exceeds2Judging whether there are two of them when they areindexSubtission is equal tokCase。So the complexity of time is`O(n^3)`。

# Code：

```python
class Solution:
    def containsNearbyDuplicate(self, nums: List[int], k: int) -> bool:
        hash_1={}
        hash_2={}
        for index, i in enumerate(nums):
            if i not in hash_1:
                hash_1[i] = 1
                hash_2[i] = [index]
            else:
                hash_1[i] += 1
                hash_2[i].append(index)
        for i in hash_1:
            if hash_1[i] >= 2:
                for j in range(len(hash_2[i])):
                    for m in range(j + 1, len(hash_2[i])):
                        if abs(hash_2[i][j]-hash_2[i][m]) <= k:
                            return True
        return False
```

look[@Gongshui Sanye](/u/ac_oier)Gongshui Sanye的解法后，Only think of，这道题的目的是为了练习双指针在Hash table中的应用，TAThe original words are sorting the meaning：Whether the existence does not exceed k+1k + 1k+1 window，window内有相同元素。

```
#Sort out the meaning：Whether the existence does not exceed k+1k + 1k+1 window，window内有相同元素。
class Solution:
    def containsNearbyDuplicate(self, nums: List[int], k: int) -> bool:
        n = len(nums)
        s = set()
        for i in range(n):
            if i > k:
                s.remove(nums[i - k - 1])
            if nums[i] in s:
                return True
            s.add(nums[i])
        return False
```
