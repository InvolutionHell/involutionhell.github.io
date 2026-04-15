---
title: "219. Contains Duplicate II — Hash Table Approach"
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
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Approach

I did this problem on my phone initially, using a double hash table — one storing elements, one storing their indices. When an element appeared more than twice, I checked whether any two of its indices had an absolute difference ≤ k. Time complexity: `O(n³)`.

# Code

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

After seeing [@Gongshui Sanye](/u/ac_oier)'s solution, I realized the point of this problem is to practice applying two pointers within a hash table. The problem is essentially asking: does a sliding window of size ≤ k+1 contain any duplicate element?

```
# Clarified problem: does a window of size ≤ k+1 contain duplicate elements?
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
