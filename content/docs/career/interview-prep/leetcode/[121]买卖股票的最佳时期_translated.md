---
title: 121.The best time for buying and selling stocks
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - Array
  - Dynamic planning
abbrlink: 3a21fe32
docId: w9ffo1wycpbz50051cb7lyo5
---

# topic：

[2251.The number of flowers during the flowering period.md](https://leetcode-cn.com/problems/number-of-flowers-that-can-be-planted-in-garden/)

# Thought：

Dynamic planning，Find the least problem
Minority problem：FirstiThe maximum profit of heaven = max(Firsti-1The maximum profit of heaven, FirstiHeavenly price - forwardi-1The minimum price of heaven)

# Code：

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        # Minority problem：FirstiThe maximum profit of heaven = max(Firsti-1The maximum profit of heaven, FirstiHeavenly price - forwardi-1The minimum price of heaven)
        dp = [0] * len(prices)
        min_price = prices[0]
        for i in range(1, len(prices)):
            dp[i] = max(dp[i - 1], prices[i] - min_price)
            min_price = min(min_price, prices[i])
        return dp[-1]
```
