---
title: "994. Rotting Oranges"
date: "2024.05.14 0:00"
tags:
  - Python
  - BFS
  - Bilateral queue
abbrlink: 56e64fdd
docId: axhoyzdtxoc82q58j1os57c8
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[994. Rotting Oranges](https://leetcode.cn/problems/rotting-oranges/)

Given an `m x n` grid where each cell can have one of three values:

- `0` represents an empty cell.
- `1` represents a fresh orange.
- `2` represents a rotten orange.

Every minute, fresh oranges **adjacent in 4 directions** to a rotten orange become rotten.

Return the minimum number of minutes until no fresh orange remains. If impossible, return `-1`.

# Approach

This problem can be solved with BFS. We track the spread of rotten oranges, record time, and check if any fresh orange remains unreachable.

Initial idea:

```python
class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        bad_orange = []
        # find all initially rotten oranges
        for i in range(len(grid)):
            for j in range(len(grid[0])):
                if grid[i][j] == 2:
                    # push into the initial queue
                    bad_orange.append((i, j))
```

Similar to multi-threading: each thread has an initial queue, and queues spread gradually via BFS.

# Code

```python
from collections import deque

class Solution:
    def orangesRotting(self, grid: List[List[int]]) -> int:
        bad_orange = deque()
        fresh_oranges = 0
        rows, cols = len(grid), len(grid[0])

        # find all initially rotten oranges and count fresh ones
        for i in range(rows):
            for j in range(cols):
                if grid[i][j] == 2:
                    bad_orange.append((i, j))
                elif grid[i][j] == 1:
                    fresh_oranges += 1

        # direction array: up, down, left, right
        directions = [(0, 1), (1, 0), (0, -1), (-1, 0)]

        # if no fresh oranges, return 0 immediately
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

        # if fresh oranges remain, return -1
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

	// find all initially rotten oranges and count fresh ones
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if grid[r][c] == 2 {
				badOranges = append(badOranges, [2]int{r, c})
			} else if grid[r][c] == 1 {
				freshOranges += 1
			}
		}
	}

	// if no fresh oranges, return 0
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

	// if fresh oranges remain, return -1
	if freshOranges > 0 {
		return -1
	}
	return minutes - 1
}
```
