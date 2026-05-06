---
title: 1828. Statistics the number of a circle mid -point One question daily
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - math
abbrlink: 3277549c
docId: chb8ee5s38v8gh751n9e5znj
---

# topic：

[1828. Statistics the number of a circle mid -point](https://leetcode.cn/problems/queries-on-number-of-points-inside-a-circle/description/)

# Thought：

Today's question is very simple，I wonder if it is against yesterday's question bidding。
Ask`queries`There are a few in the circle`points`Points in an array。
To be honest, I was scared，I think this question is the question of the picture again。不过仔细读题了后发现只是一道简单的math题，
We can use European -style distance to solve（Time complexity isOn^2，I thought I had a better solution，At first glance everyone is like this（））

The formula of the European -style distance is as follows：

$\sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$

We look at the code for specific operations：

# Code

```python
class Solution:
    def countPoints(self, points: List[List[int]], queries: List[List[int]]) -> List[int]:
        # Seek to solve whether the European -style distance from the center is less than r
        ans = [0] * len(queries)
        flag = 0
        for x, y, r in queries:
            for i, j in points:
                if ((x - i) ** 2 + (y - j) ** 2) ** (1 / 2) <= r:
                    ans[flag] += 1
            flag += 1
        return ans
```

Take a look at someone who can't understandpythonCode：

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
