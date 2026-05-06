---
title: "2241. 设计 ATM 机器"
date: "2025-01-06"
tags:
  - - Python
  - - Answer
abbrlink: a21411f
docId: lzrh7ftq3kegsyx8gimonrfu
lang: zh
translatedFrom: en
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# 题目

[2241. 设计 ATM 机器](https://leetcode.cn/problems/design-an-atm-machine/description/?envType=daily-question&envId=2025-01-05)

有一台 ATM 机器，存储了 5 种面额的钞票：20 美元、50 美元、100 美元、200 美元和 500 美元。初始时 ATM 内没有任何钞票。用户可以用这台机器存钱或取钱。

取款时，机器优先使用面额较大的钞票。

例如，如果想取 300 美元，而机器里有 2 张 50 美元、1 张 100 美元和 1 张 200 美元，则机器会使用 100 美元和 200 美元那两张钞票。

但如果想取 600 美元，而机器里有 3 张 200 美元和 1 张 500 美元，那么取款请求会被拒绝，因为机器会先尝试使用 500 美元，然后无法用剩余钞票凑出 100 美元。注意，此时不允许改用 200 美元代替 500 美元。

实现 ATM 类：

- `ATM()` 初始化 ATM 对象。
- `void deposit(int[] banknotesCount)` 按 $20、$50、$100、$200、$500 的顺序存入新钞票。
- `int[] withdraw(int amount)` 按 $20、$50、$100、$200、$500 的顺序返回一个长度为 5 的数组，表示向用户提供的各面额钞票数量，并更新 ATM 内剩余钞票数量。如果无法完成取款，返回 `[-1]`（此时不取出任何钞票）。

# 思路

这道题的目的是模拟一台 ATM 机器，让你取多少钱，就返回多少钱，不能多也不能少。我用的是贪心思想，因为"机器里有 3 张 `$200` 的钞票和 1 张 `$500` 的钞票，那么取款请求会被拒绝"这句话说明可以跳过复杂动态规划中的背包问题，直接考虑简单贪心。

由于存的钱的面额只有 `20`、`50`、`100`、`200`、`500` 这五种，我们提前存在列表里等待遍历即可。然后创建一个 `defaultdict()` 为 ATM 机器里的每种面额创建哈希表。

`deposit()` 创建了一个反向遍历的字典。因为我们需要从大面额到小面额遍历，反向字典在此非常方便。

假设初始 `amount` 为 `600`，遍历到的第一个面额就是 `500`，完全符合题目逻辑。

`withdraw()` 函数中，我创建了一个临时字典深拷贝，这样在返回 `[-1]` 时不会修改初始数组。否则还要回溯，比较麻烦。

我和 Sylvia 用了两种不同的遍历方式：她遍历面额列表，而我直接遍历字典（实际上直接遍历 key）。

1. 如果当前金额（`600`）大于等于当前面额（`500`），则尝试扣除。如果银行钱直接取完，再看下一个面额。
2. 如果没有取完，`amount` 扣除能扣除的份额后，继续看下一个面额。
3. 最后 `amount` 还有剩余则返回 `[-1]`，否则计算一共消耗了多少张钞票，即为答案。

# 代码

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
