---
title: "6323. Distribute Money to Maximum Children"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: b9130c0e
docId: kw44if3s2zi4w2gs1gfhxvoz
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

First encountered: `2023/3/19-16:51`

[6323. Distribute Money to Maximum Children](https://leetcode.cn/problems/distribute-money-to-maximum-children/)

# Approach

This was a weekly contest problem from March. I realized early it was a math problem, but spent a long time not knowing how to handle the remaining money after distribution.

So I wrote a list-based approach, giving money to children one by one.

**Mathematical approach:**

- If 0 children remain but `money > 0`, then we must take money back from one child who already received $8 — `ans` minus one.
- If 1 child remains but `money == 3`, to avoid giving exactly $4, we must take money from a child who received $8 — `ans` minus one.
- In all other cases, give the remaining money to one child. If that child gets exactly $4, swap $1 with another child, so `ans` stays constant.

**ylb's explanation (updated 2023-9-22):**

- If `money < children`, there must be children who get nothing — return `−1`.
- If `money > 8 × children`, `children − 1` children each get $8, and the last child gets the rest — return `children − 1`.
- If `money == 8 × children − 4`, `children − 2` children get $8, and the two remaining share $12 (just not $4 or $8 each) — return `children − 2`.
- Otherwise, assume `x` children each get $8. The remaining money is `money − 8x`, and we need it to be ≥ `children − x`. Maximize `x`.

# Code

```python List
class Solution:
    def distMoney(self, money: int, children: int) -> int:
        money -= children
        children_list = [1] * children
        if money < 0:
            return -1
        counts = min(money // 7, children)
        for i in range(counts):
            children_list[i] = 8
        children_list[-1] += money - counts * 7
        counts = children_list.count(8)
        if children_list[-1] == 4:
            if children_list[-2] != 8:
                pass
            else:
                counts -= 1
        return counts
```

```python math
class Solution:
    def distMoney(self, money: int, children: int) -> int:
        money -= children  # each child gets at least $1
        if money < 0: return -1
        ans = min(money // 7, children)  # preliminary allocation, maximize children getting $8
        money -= ans * 7
        children -= ans
        # children == 0 and money: must give remaining money to a child already at $8
        # children == 1 and money == 3: avoid giving exactly $4 to any child
        if children == 0 and money or \
           children == 1 and money == 3:
            ans -= 1
        return ans
```

```python ylb
class Solution:
    def distMoney(self, money: int, children: int) -> int:
        if money < children:
            return -1
        if money > 8 * children:
            return children - 1
        if money == 8 * children - 4:
            return children - 2
        return (money-children) // 7
```
