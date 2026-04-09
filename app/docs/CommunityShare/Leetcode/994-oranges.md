---
title: 994.Rotten orange.md
date: "2024.05.14 0:00"
tags:
  - Python
  - BFS
  - Bilateral queue
abbrlink: 56e64fdd
docId: axhoyzdtxoc82q58j1os57c8
---

# topic：

"""

<p>Given&nbsp;<code>m x n</code>&nbsp;grid
 &lt;meta charset="UTF-8" /&gt;&nbsp;<code>grid</code>&nbsp;middle，Each cell can have one of the following three values：</p>

<ul> 
 <li>value&nbsp;<code>0</code>&nbsp;Represents the empty unit；</li> 
 <li>value&nbsp;<code>1</code>&nbsp;Represents fresh oranges；</li> 
 <li>value&nbsp;<code>2</code>&nbsp;代表Rotten orange。</li> 
</ul>

<p>every minute，Rotten orange&nbsp;<strong>around&nbsp;4 Adjacent in this direction</strong> Fresh oranges will rot。</p>

<p>return <em>直到单元格middle没有新鲜橘子为止所必须经过的最小分钟数。If it is impossible，return&nbsp;<code>-1</code></em>&nbsp;。</p>

<p>&nbsp;</p>

<p><strong>Exemplary example 1：</strong></p>

<p><strong>&lt;img alt="" src="https://assets.leetcode-cn.com/aliyun-lc-upload/uploads/2019/02/16/oranges.png" style="height: 137px; width: 650px;" /&gt;</strong></p>

<pre>
<strong>enter：</strong>grid = [[2,1,1],[1,1,0],[0,1,1]]
<strong>Output：</strong>4
</pre>

<p><strong>Exemplary example 2：</strong></p>

<pre>
<strong>enter：</strong>grid = [[2,1,1],[0,1,1],[1,0,1]]
<strong>Output：</strong>-1
<strong>explain：</strong>Orange in the lower left corner（First 2 OK， First 0 List）Never rot，Because rotten will only happen in 4 In the direction。
</pre>

<p><strong>Exemplary example 3：</strong></p>

<pre>
<strong>enter：</strong>grid = [[0,2]]
<strong>Output：</strong>0
<strong>explain：</strong>because 0 There is no fresh orange in minutes，So the answer is 0 。
</pre>

<p>&nbsp;</p>

<p><strong>hint：</strong></p>

<ul> 
 <li><code>m == grid.length</code></li> 
 <li><code>n == grid[i].length</code></li> 
 <li><code>1 &lt;= m, n &lt;= 10</code></li> 
 <li><code>grid[i][j]</code> Only for&nbsp;<code>0</code>、<code>1</code>&nbsp;or&nbsp;<code>2</code></li> 
</ul>

<div><div>Related Topics</div><div><li>Priority search</li><li>Array</li><li>matrix</li></div></div><br><div><li>👍 872</li><li>👎 0</li></div>
"""

# Thought：

这个问题可以用Priority search（BFS）To solve。We need to track the spread of rotten oranges，Record time，And check if there is a fresh orange that cannot be rotten。The initial idea of ​​the original idea：

```python
class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        bad_orange = []
        # 找到所有初始Rotten orange
        for i in range(len(grid)):
            for j in range(len(grid[0])):
                if grid[i][j] == 2:
                    # 存入初始队List
                    bad_orange.append((i, j))
```

Similar to multi -threaded，每个线程存入一个初始队List，初始队List通过BFSGradual diffusion

# Code：

```python
from collections import deque

class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        bad_orange = deque()
        fresh_oranges = 0
        rows, cols = len(grid), len(grid[0])

        # 找到所有初始Rotten orange，And calculate the number of fresh oranges
        for i in range(rows):
            for j in range(cols):
                if grid[i][j] == 2:
                    bad_orange.append((i, j))
                elif grid[i][j] == 1:
                    fresh_oranges += 1

        # 方向Array：up down left right
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

        # If there is no fresh orange，直接return 0
        if fresh_oranges == 0:
            return 0

        # BFS
        minutes = 0
        while bad_orange:
            minutes += 1
            for _ in range(len(bad_orange)):
                x, y = bad_orange.popleft()
                for dx, dy in directions:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == 1:
                        grid[nx][ny] = 2
                        fresh_oranges -= 1
                        bad_orange.append((nx, ny))

        # If there are fresh oranges，return -1
        return minutes - 1 if fresh_oranges == 0 else -1
```

```go
import (
	"sync"
)

func orangesRotting(grid [][]int) int {
	rows, cols := len(grid), len(grid[0])
	badOranges := make([][2]int, 0)
	freshOranges := 0

	// 找到所有初始Rotten orange，And calculate the number of fresh oranges
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if grid[r][c] == 2 {
				badOranges = append(badOranges, [2]int{r, c})
			} else if grid[r][c] == 1 {
				freshOranges += 1
			}
		}
	}

	// If there is no fresh orange，直接return 0
	if freshOranges == 0 {
		return 0
	}

	directions := [][2]int{{0, 1}, {1, 0}, {0, -1}, {-1, 0}}
	minutes := 0

	var wg sync.WaitGroup

	// BFS
	for len(badOranges) > 0 {
		minutes++
		nextBadOranges := make([][2]int, 0)
		for _, orange := range badOranges {
			x, y := orange[0], orange[1]
			wg.Add(1)
			go func(x, y int) {
				defer wg.Done()
				for _, d := range directions {
					nx, ny := x+d[0], y+d[1]
					if nx >= 0 && nx < rows && ny >= 0 && ny < cols && grid[nx][ny] == 1 {
						grid[nx][ny] = 2
						nextBadOranges = append(nextBadOranges, [2]int{nx, ny})
						freshOranges--
					}
				}
			}(x, y)
		}
		wg.Wait()
		badOranges = nextBadOranges
	}

	// If there are fresh oranges，return -1
	if freshOranges > 0 {
		return -1
	}
	return minutes - 1
}
```
