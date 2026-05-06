---
title: Counting Stars-Inter-Uni Programming Contest.md
date: 22/9/2024
tags:
  - Contest
  - Python
  - Binary Search
abbrlink: a29b0a05
docId: fostlzqqx6l10qz1egd8dw5m
---

# Description:

https://interunia.unswcpmsoc.com/task/Counting%20Stars/

# Thinking:

- Given a set of star positions, we need to calculate the minimum number of stars required to explain these positions.
- Meteors (i.e., moving stars) move from left to right, and from high to low (x coordinates increase, y coordinates decrease), without moving horizontally or vertically.
- Each meteor may appear in multiple positions (because it moves), and the final cumulative image will show all the positions it has passed through.
- The positions of fixed stars remain unchanged.

Therefore, we need to maintain a list of the **last y-coordinate of the current chain**.

1. **Sort the points**: Sort them by increasing x coordinates.
2. **Initialization**: Create an empty list `last_y` to store the last y-coordinate of each chain.
3. **Traverse the set of points**:
   - For each point (x, y):
     - Use `bisect_right` to find the first position in `last_y` that is greater than the current y.
     - If the index is less than the length of `last_y`, it means there is an existing chain that can accommodate the current point, so we update the last y-coordinate of that chain to the current y.
     - If the index is equal to the length of `last_y`, it means no suitable chain is found, so we need to create a new chain and add the current y to `last_y`.

# Code:

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
