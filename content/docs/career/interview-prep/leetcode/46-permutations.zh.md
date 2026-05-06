---
title: "46. 全排列"
date: 24/3/2025
tags:
  - Python
  - "9021"
  - tree
abbrlink: d567a4cd
docId: mxt0ux1zpbzph4nuxz51eyg7
lang: zh
translatedFrom: en
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# 题目描述

给定一个不含重复数字的整数数组 `nums`，返回其所有可能的全排列。答案可以以任意顺序返回。

示例 1：

输入：nums = [1,2,3]
输出：[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]

示例 2：

输入：nums = [0,1]
输出：[[0,1],[1,0]]

示例 3：

输入：nums = [1]
输出：[[1]]

# 思路

这道题更像是一道树形问题，可以用如下树形结构来理解：

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

我们将当前位置 `index` 与从 `index` 到末尾的每个候选位置 `i` 进行交换。可以将 `index` 和 `i` 看作左右指针：`index` 决定正在填充哪个位置，`i` 尝试将不同的数字放入该位置。

递归调用前，交换 `nums[i]` 和 `nums[index]`，尝试在位置 `index` 放置新数字。当到达最后一个位置（`index == len(nums) - 1`）时，将当前排列加入结果列表。递归返回后，再次交换以恢复原始状态（回溯）。

# 代码

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
