---
title: "Counting Stars — 校际编程竞赛"
date: 22/9/2024
tags:
  - Contest
  - Python
  - Binary Search
abbrlink: a29b0a05
docId: fostlzqqx6l10qz1egd8dw5m
lang: zh
translatedFrom: en
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# 题目描述

https://interunia.unswcpmsoc.com/task/Counting%20Stars/

# 思路

- 给定一组星星的位置，需要计算能解释这些位置所需的最少星星数量。
- 流星（即移动的星星）从左向右、从高到低运动（x 坐标增大，y 坐标减小），不做水平或垂直移动。
- 每颗流星可能出现在多个位置（因为它在移动），最终的累积图像会显示它经过的所有位置。
- 固定星星的位置保持不变。

因此，我们需要维护一个**当前链的最后 y 坐标列表**。

1. **对点排序**：按 x 坐标递增排序。
2. **初始化**：创建空列表 `last_y` 存储每条链的最后 y 坐标。
3. **遍历点集**：
   - 对于每个点 `(x, y)`：
     - 用 `bisect_right` 在 `last_y` 中找到第一个大于当前 y 的位置。
     - 如果索引小于 `last_y` 长度，说明存在可以容纳当前点的链，更新该链的最后 y 坐标为当前 y。
     - 如果索引等于 `last_y` 长度，说明没有合适的链，需要创建新链，将当前 y 加入 `last_y`。

# 代码

```python
import bisect

n = int(input())
stars = []

for _ in range(n):
    x, y = map(int, input().split())
    stars.append((x, y))

# 按 x 坐标递增排序
stars.sort(key=lambda x: (x[0],))

last_y = []

for x, y in stars:
    idx = bisect.bisect_right(last_y, y)
    if idx < len(last_y):
        last_y[idx] = y  # 更新链的最后一个 y 坐标
    else:
        last_y.append(y)  # 创建新的链

print(len(last_y))
```
