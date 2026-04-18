---
title: 2679.In the matrix and the harmony.md
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
---

# topic：

[2679.In the matrix and the harmony.md](https://leetcode.cn/problems/sum-in-a-matrix/)

# Thought：

**One -line**
First of all, the meaning is to find the largest number of each sub -list，Thenpopgo out，Finally ask for peace。
The effect of traversing again and again is too bad，So I thought of using itzip一次性Traversal多个子Array。
于yes先对每个子ArraySort，Then usezipTraversal，Find the maximum。
for example：
`nums = [[7,2,1],[6,4,2],[6,5,3],[3,2,1]]`
Sort后：
`nums = [[1,2,7],[2,4,6],[3,5,6],[1,2,3]]`
Then usezipTraversal得到：
`[(1,2,3,1),(2,4,5,2),(7,6,6,3)]`
Find the maximum：
`[3,5,7]`
Context：
`15`

# Code：

```python
class Solution:
    def matrixSum(self, nums: List[List[int]]) -> int:
        return sum(max(i) for i in \
        zip(*(sorted(sublist) for sublist in nums)))
```

### \*The role and the rolezip()explain

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

`zip()`The function corresponds to one -to -one elements in multiple lists，Then return onezipObject，Can uselist()Function convert to list。

```python
for i in zip(num1, num2, num3, num4):
    print(i)
#(1, 2, 3, 1)
#(2, 4, 5, 2)
#(7, 6, 6, 3)
```

`*nums`The role ispythonNot a pointer，InsteadnumsEach element in the parameter is passed into the function。I understand here as a list。

```python

# Enumerate
print(*nums)
# [1, 2, 7] [2, 4, 6] [3, 5, 6] [1, 2, 3]
```

`zip(*nums)`WillnumsEach element is passed in as a parameterzip()In the function，Then return onezipObject，Can uselist()Function convert to list。
`zip(*nums)`Equivalent to`zip(num1, num2, num3, num4)`，innum1, num2, num3, num4yesnumsElement。

```python
for i in zip(*nums):
    print(i)
# Equivalent
#(1, 2, 3, 1)
#(2, 4, 5, 2)
#(7, 6, 6, 3)
```
