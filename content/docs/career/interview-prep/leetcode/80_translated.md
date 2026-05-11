---
title: Python beat98.40% collectionsofCounter method！
description: "LeetCode 80. 删除有序数组中的重复项 II 题解 — 使用双指针原地修改数组，允许每个元素最多出现两次，关键技巧是维护慢指针控制写入位置与快指针遍历数组，适合准备面试、需要掌握数组去重与双指针技巧的求职者与算法学习者。"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - solved
    - answer
abbrlink: 73b5ce9c
category: null
docId: ryp6s59uwc10w2dywgs6f66h
---

Pyhton `collection` In the bag `Counter()` Be rightlist里出现of元素conduct计数，And the output is a dictionary。
for example`nums=[1, 1, 1, 2, 2, 3]` ToCounter后of结果是`Counter({1: 3, 2: 2, 3: 1})`。

1. So traverse a dictionary，when`value>3`of时候`value=2`，Can be greater than2indivualof元素计数become2indivual。
1. So we will`Counter({1: 3, 2: 2, 3: 1})`become`Counter({1: 2, 2: 2, 3: 1})`后再Toelementsconductlist操作就可以得到改变后of列表了。

---

Due to the meaning of the question“Input the array「Quote」方式传递of”，So we willnumsJust fill in and fill in

```python
from collections import Counter # Imported package
class Solution:
    def removeDuplicates(self, nums: List[int]) -> List[int]:
        dict1 = Counter(nums)
        for i in dict1:
            if dict1[i] > 2:
                dict1[i] = 2
        list1 = list(dict1.elements())
        nums.clear() # clear the list
        nums.extend(list1) # Add the collection to the list
        return len(nums)
```

Complexity analysis

time complexity：`O(n)`，in `n` 是数组of长度。We have a maximum of this array once。

Spatial complexity：`O(1)`。我们只需要常数of空间存储若干变量。
