---
title: "121. Best Time to Buy and Sell Stock"
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - Array
  - Dynamic planning
abbrlink: 3a21fe32
docId: w9ffo1wycpbz50051cb7lyo5
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[121. Best Time to Buy and Sell Stock](https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock/)

# Approach

Dynamic programming — find the minimum problem.

Recurrence: the maximum profit on day `i` = max(maximum profit on day `i-1`, price on day `i` − minimum price before day `i`)

# Code

```python
class Solution:
    def maxProfit(self, prices: List[int]) -> int:
        # Recurrence: max profit on day i = max(max profit on day i-1, price on day i - min price before day i-1)
        dp = [0] * len(prices)
        min_price = prices[0]
        for i in range(1, len(prices)):
            dp[i] = max(dp[i - 1], prices[i] - min_price)
            min_price = min(min_price, prices[i])
        return dp[-1]
```
