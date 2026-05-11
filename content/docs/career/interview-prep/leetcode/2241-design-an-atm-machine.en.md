---
title: "2241. Design an ATM Machine"
description: "LeetCode 2241. Design an ATM Machine — solution using a greedy algorithm to simulate ATM deposit and withdrawal logic. The core technique is iterating denominations in reverse (500→20) with a hash map tracking banknote counts, always using the largest denomination first. Suitable for CS/AI job seekers preparing for system design interviews or practicing medium-difficulty simulation problems."
date: "2025-01-06"
tags:
  - - Python
  - - Answer
abbrlink: a21411f
docId: lzrh7ftq3kegsyx8gimonrfu
lang: en
translatedFrom: zh
translatedAt: 2026-05-11T00:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[2241. Design an ATM Machine](https://leetcode.cn/problems/design-an-atm-machine/description/?envType=daily-question&envId=2025-01-05)

There is an ATM machine that stores banknotes of 5 denominations: $20, $50, $100, $200, and $500. Initially the ATM is empty. Users can deposit or withdraw money.

When withdrawing, the machine prioritizes using banknotes of larger denominations.

For example, if you want to withdraw $300 and there are 2 $50 banknotes, 1 $100 banknote, and 1 $200 banknote, the machine will use the $100 and $200 banknotes.

However, if you try to withdraw $600 and there are 3 $200 banknotes and 1 $500 banknote, the request will be rejected — the machine first tries to use the $500 banknote, then cannot make up the remaining $100. Note that switching to $200 banknotes instead of the $500 is not allowed.

Implement the ATM class:

- `ATM()` initializes the ATM object.
- `void deposit(int[] banknotesCount)` deposits new banknotes in the order $20, $50, $100, $200, $500.
- `int[] withdraw(int amount)` returns an array of length 5 representing the number of banknotes of each denomination handed to the user (in the order $20, $50, $100, $200, $500), and updates the ATM's remaining banknotes. Returns `[-1]` if the withdrawal is impossible (no banknotes are dispensed in that case).

# Approach

The goal of this problem is to simulate an ATM — dispense exactly as much as requested, no more and no less. I use a greedy strategy, because the statement "if there are 3 `$200` banknotes and 1 `$500` banknote, the withdrawal request will be rejected" tells us we can skip the knapsack problem entirely and apply simple greedy logic.

Since there are only five denominations — `20`, `50`, `100`, `200`, `500` — we store them in a list and iterate as needed. We then create a `defaultdict()` to maintain a hash map of banknote counts for each denomination.

`deposit()` builds a reverse-order dictionary. Since we need to traverse from the largest to the smallest denomination, a reverse dictionary is very convenient here.

Assuming the initial `amount` is `600`, the first denomination encountered is `500`, which fits the problem's logic perfectly.

In the `withdraw()` function, I create a deep copy of the dictionary as a temporary store. This way, when we need to return `[-1]`, the original banknote counts remain unchanged — avoiding the need for backtracking.

Sylvia and I used two different traversal approaches: she iterated over the denomination list, while I iterated directly over the dictionary (effectively over its keys).

1. If the current amount (`600`) is greater than or equal to the current denomination (`500`), try to deduct. If all banknotes of that denomination are used up, move to the next denomination.
2. If not fully used up, deduct as much as possible from `amount` and continue to the next denomination.
3. If `amount` still has a remainder at the end, return `[-1]`; otherwise, calculate the total number of banknotes consumed — that is the answer.

# Code

```python
import copy
from typing import List

from collections import defaultdict


class ATM:

    def __init__(self):
        self.sd = defaultdict(int)
        self.amount = ['20', '50', '100', '200', '500']

    def deposit(self, banknotesCount: List[int]) -> None:
        for i in range(len(banknotesCount) - 1, -1, -1):
            self.sd[self.amount[i]] += banknotesCount[i]



    def withdraw(self, amount: int) -> List[int]:
        tempSd = copy.deepcopy(self.sd)
        # key = 面值, value = 张数
        for key, value in tempSd.items():
            if amount >= int(key) and value > 0:
                # 需要多少张钞票
                howManyPiece = amount // int(key)
                if howManyPiece >= value:
                    # 全部取出来
                    tempSd[key] = 0
                    amount -= value * int(key)
                else:
                    # 取出这么多钞票
                    tempSd[key] -= howManyPiece
                    amount -= int(key) * howManyPiece
        else:
            if amount > 0:
                return [-1]
            else:
                ans = []
                for i in self.sd.keys():
                    ans.append(self.sd[i] - tempSd[i])
                self.sd = copy.deepcopy(tempSd)
                return ans[::-1]
```
