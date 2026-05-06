---
title: "1653. Minimum Deletions to Make String Balanced"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: cac21f27
docId: bsf0yz1zrmlz7masrdmq8fq6
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[1653. Minimum Deletions to Make String Balanced](https://leetcode.cn/problems/minimum-deletions-to-make-string-balanced/description/)

# Approach

**Q:** Why does writing it with `if-else` as `(c - 'a') * 2 - 1` run much faster?

**A:** When the CPU encounters a branch (conditional jump instruction), it predicts which branch will be executed. If the prediction is correct, the CPU continues along the predicted path. If the prediction fails, the CPU must roll back previous instructions and load the correct ones to ensure correctness.

For the data in this problem, characters `'a'` and `'b'` can be considered to appear randomly, which means branch prediction will fail with roughly 50% probability.

The rollback and reload operations caused by mispredictions consume extra CPU cycles. If the branch can be eliminated at a lower cost, it will inevitably improve efficiency for this type of problem.

**Note:** This optimization technique often reduces readability — it's best not to use it in production code.

# Code

```python
class Solution:
    def minimumDeletions(self, s: str) -> int:
        ans = delete = s.count('a')
        for c in s:
            delete -= 1 if c == 'a' else -1
            if delete < ans:  # manual min is much faster
                ans = delete
        return ans

```
