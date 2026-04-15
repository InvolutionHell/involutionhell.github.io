---
title: "93. 复原 IP 地址"
date: "2025/3/25-14:03"
tags:
  - - Python
  - - Answer
abbrlink: 9d0d3b9c
docId: d5evrnoglwjvmyginjq84bl0
lang: zh
translatedFrom: en
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# 题目

[93. 复原 IP 地址](https://leetcode.cn/problems/restore-ip-addresses/description/?envType=company&envId=mihoyo&favoriteSlug=mihoyo-all)

# 思路

这道 MiHoYo 笔试题和 LeetCode 46（全排列）非常相似，都依赖回溯思路。

如代码所示，在第一遍遍历中，我们可能得到类似 `['2', '5', '5', '2']` 的初始 `parts`，但此时还没有遍历完整个字符串。

进入下一层 DFS 时，指针因为刚刚 `+length`，实际上指向了当前段的最右边。如果指针已经到达字符串末尾，说明我们已访问完所有字符——此时找到一个合法答案，加入结果列表。

重要提示：`parts + [part]` 是值传递而非像第 46 题那样的引用传递。这意味着我们不需要手动撤销更改（不需要 `pop()` 回溯），因为每次递归调用都会创建一个新列表。

This MiHoYo coding test question is very similar to LeetCode 46 (Permutations), and both rely on the backtracking approach.

As shown in the code, during the first traversal, we may get something like `['2', '5', '5', '2']` as our initial parts, but at this point, we haven't traversed the entire string yet.

When we enter the next level of DFS, the pointer moves forward by `+length`, so it effectively moves to the far right of the current segment. If the pointer has reached the end of the string, it means we've visited all characters — in this case, we've found one valid answer and can add it to the result list.

One important note: `parts + [part]` is pass-by-value, not by reference like in LeetCode 46. This means we don't need to manually undo changes (i.e., no need to backtrack with `pop()`), because each recursive call creates a new list.

# 代码

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
