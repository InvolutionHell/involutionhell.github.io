---
title: "2894. Divisible and Non-divisible Sums Difference"
date: "2025.05.27 23:52"
tags:
  - - Python
  - - answer
  - - typescript
abbrlink: 66adcc9e
docId: y0ntwlksnvj7ymuapqvkvmwr
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

[2894. Divisible and Non-divisible Sums Difference](https://leetcode.cn/problems/divisible-and-non-divisible-sums-difference/description/)

# Approach

**Problem statement:**  
In $[1, n]$, find the difference between the sum of all numbers not divisible by $m$ and the sum of all numbers divisible by $m$.

**Derivation:**

1. Total sum:  
   $S_{\text{total}} = \sum_{i=1}^{n} i = \frac{n(n+1)}{2}$

2. Numbers divisible by $m$: $m, 2m, 3m, \dots, \left\lfloor \frac{n}{m} \right\rfloor m$  
   $S_{\text{divisible}} = m \cdot \left(1 + 2 + \dots + k\right) = m \cdot \frac{k(k+1)}{2}$

3. Sum of non-divisible numbers:  
   $S_{\text{not\_div}} = S_{\text{total}} - S_{\text{divisible}}$

4. The required answer:  
   $\text{difference} = S_{\text{not\_div}} - S_{\text{divisible}}$  
   $= \frac{n(n+1)}{2} - m \cdot \left\lfloor \frac{n}{m} \right\rfloor(\left\lfloor \frac{n}{m} \right\rfloor+1)$

# Code

```python
class Solution:
    def differenceOfSums(self, n: int, m: int) -> int:
        # divisible = m * (1 + n // m) * (n // m) // 2
        # undivisible = n * (n + 1) // 2 - n * ((1 + n // m) * (n // m) // 2)
        return - m * ((1 + n // m) * (n // m)) + (n * (n + 1) >> 1)
```

```typescript
const differenceOfSums = (n: number, m: number): number =>
  -m * ((1 + Math.floor(n / m)) * Math.floor(n / m)) + ((n * (n + 1)) >> 1);
```
