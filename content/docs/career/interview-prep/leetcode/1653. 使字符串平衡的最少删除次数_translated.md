---
title: 1653. The minimum number of times to balance the string balance.md
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: cac21f27
docId: bsf0yz1zrmlz7masrdmq8fq6
---

# topic：

[1653. The minimum number of times to balance the string balance.md](https://leetcode.cn/problems/minimum-deletions-to-make-string-balanced/description/)

# Thought：

ask：Why if-else Write (c - 'a') \* 2 - 1 It will be much faster？

answer：CPU I encounter a branch（Condition jump instruction）Which branch of the code will be predicted when the code is executed，If the prediction is correct，
CPU It will continue to execute the program in accordance with the predicted path。But if the prediction fails，CPU You need to roll back the previous instructions and load the correct instructions，To ensure the correctness of the program execution。

For the data of this question，character ‘a’ and ‘b’ It can be considered to appear random，In this case, the branch prediction will be available 50% Probability failure。
失败导致的回滚and加载操作需要消耗额外的 CPU cycle，If the branch can be removed at a smaller price，The situation of this question can inevitably bring efficiency improvement。

Notice：This optimization method often reduces readability，It's best not to use in business code。

# Code：

```python
class Solution:
    def minimumDeletions(self, s: str) -> int:
        ans = delete = s.count('a')
        for c in s:
            delete -= 1 if c == 'a' else -1
            if delete < ans:  # Manually min It will be much faster
                ans = delete
        return ans

```
