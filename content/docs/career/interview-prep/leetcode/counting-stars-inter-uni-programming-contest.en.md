---
title: "Counting Stars — Inter-University Programming Contest"
description: "LeetCode solution — Counting Stars Inter-University Programming Contest. Uses a greedy algorithm with binary search to maintain a list of chain-tail y-coordinates. After sorting points, traverse the point set and use bisect_left to find chains that can accommodate the current point, then solve for the minimum number of meteors. Ideal for CS students preparing for algorithm competitions and learning greedy + binary search techniques."
date: 22/9/2024
tags:
  - Contest
  - Python
  - Binary Search
abbrlink: a29b0a05
docId: fostlzqqx6l10qz1egd8dw5m
lang: en
translatedFrom: zh
translatedAt: 2026-05-11T00:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem Description

https://interunia.unswcpmsoc.com/task/Counting%20Stars/

# Approach

- Given a set of star positions, we need to calculate the minimum number of stars required to explain these positions.
- Meteors (i.e., moving stars) move from left to right and from high to low (x coordinates increase, y coordinates decrease), without horizontal or vertical movement.
- Each meteor may appear at multiple positions (because it moves), and the final accumulated image shows all positions it has passed through.
- Fixed stars remain stationary.

Therefore, we need to maintain a **list of the last y-coordinate of the current chain**.

1. **Sort the points**: Sort by increasing x coordinate.
2. **Initialization**: Create an empty list `last_y` to store the last y-coordinate of each chain.
3. **Traverse the point set**:
   - For each point `(x, y)`:
     - Use `bisect_right` to find the first position in `last_y` that is greater than the current y.
     - If the index is less than the length of `last_y`, there exists a chain that can accommodate the current point — update that chain's last y-coordinate to the current y.
     - If the index equals the length of `last_y`, no suitable chain exists — create a new chain and append the current y to `last_y`.

# Code

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
