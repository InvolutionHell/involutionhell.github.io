---
title: "2335. Minimum Amount of Time to Fill Cups — Daily Problem"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - dp
  - - Daily problem
  - - golang
abbrlink: 4400daa1
docId: hiqhki2z4v6oy0jstrcs7im0
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[2335. Minimum Amount of Time to Fill Cups](https://leetcode.cn/problems/minimum-amount-of-time-to-fill-cups/description/)

# Approach

1. This problem is actually quite simple, though I didn't use a greedy approach initially. Looking at the second test case, I realized the key insight: minimize the chance of any count reaching 0. So keep sorting and always operate on the two largest numbers. This also handles edge cases naturally. But because of the sorting, I'm unsure if it scales well for very large inputs.

   Looking at ylb's solution — same idea but with much cleaner edge case handling, two fewer conditionals than mine. The mathematical approach below may be the intended solution for harder cases.

2. **Mathematical approach?** Sort the three drink counts from small to large as `x, y, z`. The goal is to pair different drinks as often as possible.
   - If `x + y <= z`, the answer is `z`.
   - Otherwise, let `t = (x + y - z)`. If `t` is even, the answer is $\frac{t}{2} + z$; otherwise $\frac{t+1}{2} + z$.

# Code

```python
class Solution:
    def fillCups(self, amount: List[int]) -> int:
        amount.sort()
        count = 0
        # Try to avoid reaching 0
        while amount[-1] > 0:
            if amount[-1] > 0 and amount[1] > 0:
                amount[-1] -= 1
                amount[1] -= 1
                count += 1
            if amount[-1] > 0 and amount[1] == 0:
                return count + amount[-1]
            amount.sort()
        return count
```

```go
import "sort"

func fillCups(amount []int) int {
	ans := 0
	for amount[0] + amount[1] + amount[2] > 0 {
		sort.Ints(amount)
		ans ++
		amount[2] --
		if amount[1] > 0{
			amount[1] --
		}
	}
	return ans
}
```
