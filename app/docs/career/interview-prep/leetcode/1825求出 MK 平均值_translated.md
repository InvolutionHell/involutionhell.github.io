---
title: 1825. Seek out MK average value
date: "2024.01.01 0:00"
tags:
  - - Python
  - - unsolved
  - - difficulty
  - - Multiple set
abbrlink: 6be57ef7
docId: n38sohi8zlxesl82tgv854kj
---

# Problem -solving

maintain 3 indivual multiset：lower（Minimum kkk indivual数）、middle（Number in the middle）、upper（Most kkk indivual数）。

# Insert operation

·if num≤max(lower)，Then lowerInsert num
·if num≥min(upper)，Then upper Insert num
·otherwise，exist middle Insert num
if插入后，lower or upper There are more elements than k indivual，Then middle middle Transfer element

操作过程middlemaintain middle 的element和 sum

# Delete operation

·设删除的element为 d
·d 一定存exist于 lower ormiddle or upper middle的一indivualor多indivual集合middle
·Choose one delete
if删除后，lower or upper middle的element少于 k indivual，Then from middle middle Obtain element

操作过程middlemaintain middle 的element和 sum

# average value操作

average value = sum/(m−2⋅k)sum / (m - 2\cdot k)sum/(m−2⋅k) （Take down）。

Code with problems：

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
