---
title: 46.permutations
date: 24/3/2025
tags:
  - Python
  - "9021"
  - tree
abbrlink: d567a4cd
docId: mxt0ux1zpbzph4nuxz51eyg7
---

# Description:

Given an array nums of distinct integers, return all the possible permutations. You can return the answer in any order.

Example 1:

Input: nums = [1,2,3]
Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
Example 2:

Input: nums = [0,1]
Output: [[0,1],[1,0]]
Example 3:

Input: nums = [1]
Output: [[1]]

# Thinking:

This question is more like a tree problem.
like the tree below:

```shell
dfs(0): nums = [1,2,3]
|
|-- i=0: swap(0,0) -> [1,2,3]
|   |
|   |-- dfs(1)
|       |-- i=1: swap(1,1) -> [1,2,3]
|       |   |-- dfs(2): append [1,2,3]
|       |-- i=2: swap(1,2) -> [1,3,2]
|           |-- dfs(2): append [1,3,2]
|
|-- i=1: swap(0,1) -> [2,1,3]
|   |
|   |-- dfs(1)
|       |-- i=1: swap(1,1) -> [2,1,3]
|       |   |-- dfs(2): append [2,1,3]
|       |-- i=2: swap(1,2) -> [2,3,1]
|           |-- dfs(2): append [2,3,1]
|
|-- i=2: swap(0,2) -> [3,2,1]
    |
    |-- dfs(1)
        |-- i=1: swap(1,1) -> [3,2,1]
        |   |-- dfs(2): append [3,2,1]
        |-- i=2: swap(1,2) -> [3,1,2]
            |-- dfs(2): append [3,1,2]

```

We swap the current position index with each possible candidate `i` from `index` to the end. They can be seen as left and right pointers: `index` determines which position we're filling, and `i` tries different numbers to place there.

Before the recursive call, we swap `nums[i]` and `nums[index]` to try placing a new number at position index. If we reach the last position (`index == len(nums) - 1`), we add the current permutation to the answer list.
After recursion, we swap back to restore the original state (backtracking).

# Code:

```python
class Solution:
    def permute(self, nums: List[int]) -> List[List[int]]:
        # index
        def dfs(index):
            # Reach the last element
            if index == len(nums) - 1:
                res.append(list(nums))
                return
            for i in range(index, len(nums)):
                nums[i], nums[index] = nums[index], nums[i]
                dfs(index + 1)
                nums[i], nums[index] = nums[index], nums[i]

        res = []
        dfs(0)
        return res
```
