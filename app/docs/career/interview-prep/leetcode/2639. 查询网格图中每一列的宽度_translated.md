---
title: 2639. Query the width of each column in the grid diagram.md
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: 5a764983
docId: lnx1bszj5aqqqfa50sejjv7n
---

# topic：

[2639. Query the width of each column in the grid diagram.md](https://leetcode.cn/problems/find-the-width-of-columns-of-a-grid/description/?envType=daily-question&envId=2024-04-27)

# Thought：

The first thing I think is to usemapTo solve，`[list(map(lambda x: len(str(x)), row)) for row in grid]` Build such an expression，但是topic要求找到列的最大值，If it is done by yourself so manually, you need itO(n^2)Time complexity，SonumpyYou can easily find the iterative value of each column。

# Code：

```python
import numpy as np

class Solution:
    def findColumnWidth(self, grid: List[List[int]]) -> List[int]:
         # let's convert the grid to a numpy array
        np_grid = np.array(grid, dtype=str)
        # calculate the length of each element in the grid
        lengths = np.vectorize(len)(np_grid)
        # find the maximum length of each column
        max_lengths = lengths.max(axis=0)
        return max_lengths.tolist()
```

```rust
impl Solution {
    pub fn find_column_width(grid: Vec<Vec<i32>>) -> Vec<i32> {
        let col_n = grid[0].len();
        let mut ans = vec![0; col_n];

        for row in grid.iter() {
            for (i, &num) in row.iter().enumerate() {
                let length = num.to_string().len() as i32;
                if length > ans[i] {
                    ans[i] = length;
                }
            }
        }
        ans
    }
}
```
