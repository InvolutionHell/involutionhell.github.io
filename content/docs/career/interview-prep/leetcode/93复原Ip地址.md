---
title: 93. Restore IP Addresses
date: "2025/3/25-14:03"
tags:
  - - Python
  - - Answer
abbrlink: 9d0d3b9c
docId: d5evrnoglwjvmyginjq84bl0
---

# QUESTION：

[93. Restore IP Addresses](https://leetcode.cn/problems/restore-ip-addresses/description/?envType=company&envId=mihoyo&favoriteSlug=mihoyo-all)

# My Think：

This MiHoYo coding test question is very similar to LeetCode 46 (Permutations), and both rely on the backtracking approach.

As shown in the code, during the first traversal, we may get something like `['2', '5', '5', '2']` as our initial parts, but at this point, we haven’t traversed the entire string yet.

When we enter the next level of DFS, the pointer moves forward by +length, so it effectively moves to the far right of the current segment.
If the pointer has reached the end of the string, it means we’ve visited all characters — in this case, we’ve found one valid answer and can add it to the result list.

One important note: `parts + [part]` is pass-by-value, not by reference like in LeetCode 46.
This means we don’t need to manually undo changes (i.e., no need to backtrack with pop()), because each recursive call creates a new list.

现在在做的是MiHoyo的笔试题, 这个和46.permutation非常相似, 都是回溯思想.

如代码所示, 在第一遍遍历中, 我们会得到`['2','5','5','2']` 作为第一个parts, 但是我们并没有遍历完整个字符串.

这个时候如果我们进入新的dfs的时候, 我们的指针因为刚刚`+length`, 所以我们实际上
指到的是最右边,所以当当前指针已经指到最右边的时候, 说明我们遍历完了所有字符, 那么这就是答案之一.

`parts + [part]` 是值传递而不是46的引用传递, 所以不用手动撤销更改

# Code：

```python
from typing import List

class Solution:
    def restoreIpAddresses(self, s: str) -> List[str]:
        res = []

        def backtrack(start: int, parts: List[str]):
            # 终止条件：正好4段且用完所有字符
            # Stop condition: exactly 4 segments and all characters used up
            if len(parts) == 4:
                if start == len(s):
                    res.append(".".join(parts))
                return

            for length in range(1, 4):  # 每段长度1~3 Each segment length 1~3
                if start + length > len(s):
                    break
                part = s[start:start+length]

                # 前导0非法，但0本身合法
                # Leading 0 is illegal, but 0 itself is legal
                if len(part) > 1 and part[0] == '0':
                    continue

                if int(part) <= 255:
                    backtrack(start + length, parts + [part])  # 注意用 + 避免污染 We need to use + to avoid pollution

        backtrack(0, [])
        return res
```
