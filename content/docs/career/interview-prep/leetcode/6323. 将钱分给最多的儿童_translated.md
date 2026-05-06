---
title: 6323. Child that divides money the most.md
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: b9130c0e
docId: kw44if3s2zi4w2gs1gfhxvoz
---

# topic：

I met for the first time：'2023/3/19-16:51'

[6323. Child that divides money the most.md](https://leetcode.cn/problems/distribute-money-to-maximum-children/)

# Thought：

"--------------"

This question is the first half of the year3月份的时候的周赛topic，topic链接：6323

"--------------"

I found that this is a mathematical problem at the beginning，I wrote for a long time, I don’t know how to deal with the last money left。
So I wrote a list，One child and one child gives money。
math：
If the remaining 0 people，and money>0，Then you must be divided into one that has been divided 8 Dollar的people，
ans minus one。
If the remaining 1 people，and money=3，To avoid allocation 4 Dollar，
Then you must be divided into one that has been divided 8 Dollar的people，ans minus one。
其它情况全部给一个people，if这个people分配到 4 Dollar，
他再给另一个people 1 Dollar，so ans constant。

The following isylbExplanation of big guys：（2023-9-22renew）
if money&lt;children，Then there must be children who do not share money，return −1。

if money&gt;8×children，So children−1 A child obtained 8 Dollar，剩下的一A child obtained money−8×(children−1) Dollar，return children−1。

if money=8×children−4，So children−2 A child obtained 8 Dollar，The remaining two children sharing the rest 12 Dollar（As long as not 4, 8 Dollar就行），return children−2。

if，We assumed that there are x A child obtained 8 Dollar，Then the rest of the money is money−8×x，As long as it is guaranteed to be greater than equal to the remaining number of children children−x，You can satisfy the meaning。therefore，We just need to ask x Maximum value，That is the answer。

# Code：

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
        money -= children  # 每people至少 1 Dollar
        if money < 0: return -1
        ans = min(money // 7, children)  # Preliminary allocation，让尽量多的people分到 8 Dollar
        money -= ans * 7
        children -= ans
        # children == 0 and money：Must find a previous division 8 Dollar的people，After allocating the remaining money
        # children == 1 and money == 3：不能有people恰好分到 4 Dollar
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
