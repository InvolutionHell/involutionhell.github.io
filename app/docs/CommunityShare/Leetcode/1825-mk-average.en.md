---
title: "1825. Find MK Average"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - unsolved
  - - difficulty
  - - Multiple set
abbrlink: 6be57ef7
docId: n38sohi8zlxesl82tgv854kj
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Solution Approach

Maintain 3 multisets: `lower` (the smallest k elements), `middle` (elements in between), and `upper` (the largest k elements).

# Insert Operation

- If `num ≤ max(lower)`, insert `num` into `lower`
- If `num ≥ min(upper)`, insert `num` into `upper`
- Otherwise, insert `num` into `middle`

After insertion, if `lower` or `upper` has more than k elements, transfer an element to `middle`.

Throughout the operation, maintain the element sum of `middle`.

# Delete Operation

- Let the element to delete be `d`
- `d` must exist in one or more of `lower`, `middle`, or `upper`
- Delete from the appropriate set

After deletion, if `lower` or `upper` has fewer than k elements, retrieve an element from `middle`.

Throughout the operation, maintain the element sum of `middle`.

# Average Operation

$\text{average} = \text{sum} / (m - 2 \cdot k)$ (rounded down).

Code with issues:

```python
class MKAverage:

    def __init__(self, m: int, k: int):
        self.m = m
        self.k = k
        self.list1 = []

    def addElement(self, num: int) -> None:
        self.list1.append(num)

    def calculateMKAverage(self) -> int:
        if len(self.list1) < self.m:
            return -1
        else:
            list2 = self.list1[-1:-self.m-1:-1]
            list2 = sorted(list2)
            list2 = list2[self.k:len(list2) - self.k]
        return sum(list2) // len(list2)
```
