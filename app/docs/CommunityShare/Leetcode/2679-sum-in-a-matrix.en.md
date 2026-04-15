---
title: "2679. Sum in a Matrix"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - Array
  - - matrix
  - - Sort
  - - simulation
  - - heap（Priority queue）
abbrlink: "5277100"
docId: clx9mmqqvxipdfamqciuo146
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[2679. Sum in a Matrix](https://leetcode.cn/problems/sum-in-a-matrix/)

# Approach

**One-liner**

The idea is to find the largest number from each sub-list, pop it out, then sum those values. Traversing repeatedly would be inefficient, so I thought of using `zip` to traverse multiple sub-arrays at once.

First, sort each sub-array, then use `zip` to traverse column by column and find the maximum.

For example:  
`nums = [[7,2,1],[6,4,2],[6,5,3],[3,2,1]]`

After sorting:  
`nums = [[1,2,7],[2,4,6],[3,5,6],[1,2,3]]`

Then using `zip`:  
`[(1,2,3,1),(2,4,5,2),(7,6,6,3)]`

Find the maximum of each column:  
`[3,5,7]`

Sum:  
`15`

# Code

```python
class Solution:
    def matrixSum(self, nums: List[List[int]]) -> int:
        return sum(max(i) for i in \
        zip(*(sorted(sublist) for sublist in nums)))
```

### Explanation of `*` and `zip()`

```python
nums = [[1,2,7],[2,4,6],[3,5,6],[1,2,3]]

for i in range(len(nums[1])):
    for j in range(len(nums)):
        print(nums[j][i])
# ans = 123124527663
num1 = [1,2,7]
num2 = [2,4,6]
num3 = [3,5,6]
num4 = [1,2,3]
```

`zip()` pairs elements from multiple lists one-to-one, returning a `zip` object that can be converted to a list using `list()`.

```python
for i in zip(num1, num2, num3, num4):
    print(i)
#(1, 2, 3, 1)
#(2, 4, 5, 2)
#(7, 6, 6, 3)
```

`*nums` in Python is not a pointer — it unpacks each element of `nums` as a separate argument into the function.

```python
# Unpacking
print(*nums)
# [1, 2, 7] [2, 4, 6] [3, 5, 6] [1, 2, 3]
```

`zip(*nums)` passes each element of `nums` as a separate argument to `zip()`, equivalent to `zip(num1, num2, num3, num4)`.

```python
for i in zip(*nums):
    print(i)
# Equivalent
#(1, 2, 3, 1)
#(2, 4, 5, 2)
#(7, 6, 6, 3)
```
