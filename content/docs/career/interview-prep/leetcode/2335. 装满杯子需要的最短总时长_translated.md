---
title: 2335. The shortest total time to be filled with a cup One question daily
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - dp
  - - One question daily
  - - golang
abbrlink: 4400daa1
docId: hiqhki2z4v6oy0jstrcs7im0
---

# topic：

[2335. The shortest total time to be filled with a cup.md](https://leetcode.cn/problems/minimum-amount-of-time-to-fill-cups/description/)

# Thought：

1. This question is very simple，但是我好像没用贪心的Thought。Look at the second test case and find it found，In fact, the minimum number of seconds is to avoid a certain number as much as possible0。
   So keep sorting，Always operate the two largest numbers。This sending can also be used for DoriamountCase，But because of sorting，I don't know if it can be used for a large number。
   Look atylbBig，和我一样但是Big细节处理得很好，Two fewer judgments than me，Then it seems that the classification discussion method below may be a solution to the difficult situation。
2. mathematical method？Sort the number of drinks from small to large，Set the quantity x，y，z。Our goal is to match the different drinks as much as possible。
   like$x+y<=z$，The answer isz。like反之，Then set$t=(x+y-z)$，t是偶数The answer is
   $ \frac{t−1}{2} +z$Plus one

# Code：

```python
class Solution:
    def fillCups(self, amount: List[int]) -> int:
        amount.sort()
        count = 0
        # Try to avoid returning0
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
