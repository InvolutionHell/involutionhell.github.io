---
title: "1828. Queries on Number of Points Inside a Circle — Daily Problem"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - math
abbrlink: 3277549c
docId: chb8ee5s38v8gh751n9e5znj
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[1828. Queries on Number of Points Inside a Circle](https://leetcode.cn/problems/queries-on-number-of-points-inside-a-circle/description/)

# Approach

Today's problem is very simple — I wonder if it's a counterbalance after yesterday's hard one.

The task asks: for each circle in `queries`, how many points from the `points` array fall inside it?

Honestly, I was a bit scared at first — thought it would be a graph problem again. But after reading carefully, it's just a straightforward math problem. We can use Euclidean distance to solve it (time complexity O(n²) — I thought there would be a better solution, but at a glance everyone solved it the same way).

The Euclidean distance formula:

$\sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$

See the code for the specific implementation:

# Code

```python
class Solution:
    def countPoints(self, points: List[List[int]], queries: List[List[int]]) -> List[int]:
        # Check if the Euclidean distance from the center is <= r
        ans = [0] * len(queries)
        flag = 0
        for x, y, r in queries:
            for i, j in points:
                if ((x - i) ** 2 + (y - j) ** 2) ** (1 / 2) <= r:
                    ans[flag] += 1
            flag += 1
        return ans
```

An alternative approach from the community that is harder to understand at first glance:

```python
class Solution:
    def countPoints(self, points: List[List[int]], queries: List[List[int]]) -> List[int]:
        points = sorted(points)

        res = [0 for _ in range(len(queries))]

        for i, (u, v, r) in enumerate(queries):
            left, right = u - r, u + r

            idx1 = bisect_left(points, [left, -inf])
            idx2 = bisect_right(points, [right, inf])

            for x, y in points[idx1: idx2 + 1]:
                if (v - r <= y <= v + r and
                    (x - u) * (x - u) + (y - v) * (y - v) <= r * r):

                    res[i] += 1

        return res
```
