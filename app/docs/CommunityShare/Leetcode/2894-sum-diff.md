---
title: 2894. 分类求和并作差
date: "2025.05.27 23:52"
tags:
  - - Python
  - - answer
  - - typescript
abbrlink: 66adcc9e
docId: y0ntwlksnvj7ymuapqvkvmwr
---

[2894. 分类求和并作差](https://leetcode.cn/problems/divisible-and-non-divisible-sums-difference/description/)

# Thought

**题意：**  
在 $[1, n]$ 中，求所有不能被 $m$ 整除的数的总和与能被整除的数的总和之差。

**思路推导：**

1. 总和：  
   $S_{\text{total}} = \sum_{i=1}^{n} i = \frac{n(n+1)}{2}$

2. 能被 $m$ 整除的数为：$m, 2m, 3m, \dots, \left\lfloor \frac{n}{m} \right\rfloor m$
   $S_{\text{divisible}} = m \cdot \left(1 + 2 + \dots + k\right) = m \cdot \frac{k(k+1)}{2}$

3. 所以不能被整除的和为：  
   $S_{\text{not\_div}} = S_{\text{total}} - S_{\text{divisible}}$

4. 所求答案为：  
   $\text{差值} = S_{\text{not\_div}} - S_{\text{divisible}}$  
   $= \frac{n(n+1)}{2} - m \cdot \frac{\left\lfloor \frac{n}{m} \right\rfloor(\left\lfloor \frac{n}{m} \right\rfloor+1)}{2} - m \cdot \frac{\left\lfloor \frac{n}{m} \right\rfloor(\left\lfloor \frac{n}{m} \right\rfloor+1)}{2}$  
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
