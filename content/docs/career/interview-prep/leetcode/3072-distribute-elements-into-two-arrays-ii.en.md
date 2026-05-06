---
title: "3072. Distribute Elements into Two Arrays II"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - Tree array
  - Thread tree
  - Array
  - simulation
abbrlink: 48a38683
docId: r12u8o7j73oxhbvgphi939fb
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[3072. Distribute Elements into Two Arrays II](https://leetcode.cn/problems/distribute-elements-into-two-arrays-ii/description/?envType=daily-question&envId=2024-06-05)

Given a **1-indexed** integer array `nums` of length `n`.

Define function `greaterCount` such that `greaterCount(arr, val)` returns the number of elements in `arr` that are **strictly greater than** `val`.

You need to distribute all elements of `nums` into two arrays `arr1` and `arr2` using `n` operations. In the first operation, add `nums[1]` to `arr1`. In the second operation, add `nums[2]` to `arr2`. For the `i`-th operation (i > 2):

- If `greaterCount(arr1, nums[i]) > greaterCount(arr2, nums[i])`, add `nums[i]` to `arr1`.
- If `greaterCount(arr1, nums[i]) < greaterCount(arr2, nums[i])`, add `nums[i]` to `arr2`.
- If `greaterCount(arr1, nums[i]) == greaterCount(arr2, nums[i])`, add to the array with fewer elements.
- If still equal, add `nums[i]` to `arr1`.

Return the concatenation of `arr1` and `arr2`.

# Approach

1. **Initialization:** Reverse `nums` so we can use `pop()` instead of `pop(0)` (learned from a senior — `pop()` is much faster). Assign the first element to `arr1` and `temp1`, and the second to `arr2` and `temp2`.

2. **Iterative processing:** Use `while` to traverse remaining elements. For each element, use `bisect.bisect_right` on `arr1` and `arr2` to count elements smaller than the current one. Subtract from `len(arr1)` / `len(arr2)` to get the count of elements greater than it. To use binary search, `arr1` and `arr2` must stay sorted — use `insort()` in Python. We also maintain a separate answer array to preserve insertion order.

3. **Merge the answer**

# Code

```python
import bisect
from typing import List

class Solution:
    def resultArray(self, nums: List[int]) -> List[int]:
        nums = nums[::-1]
        temp = nums.pop()
        arr1 = [temp]
        temp1 = [temp]
        temp = nums.pop()
        arr2 = [temp]
        temp2 = [temp]
        while nums:
            temp = nums.pop()
            # [28] [2]
            index1 = bisect.bisect_right(arr1, temp)
            index2 = bisect.bisect_right(arr2, temp)
            length_1 = len(arr1) - index1
            length_2 = len(arr2) - index2
            if length_1 > length_2:
                bisect.insort(arr1, temp)
                temp1.append(temp)
            elif length_1 < length_2:
                bisect.insort(arr2, temp)
                temp2.append(temp)
            else:
                if len(arr1) > len(arr2):
                    bisect.insort(arr2, temp)
                    temp2.append(temp)
                else:
                    bisect.insort(arr1, temp)
                    temp1.append(temp)

        return temp1 + temp2
```
