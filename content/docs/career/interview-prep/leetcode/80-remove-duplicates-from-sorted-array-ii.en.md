---
title: "80. Remove Duplicates from Sorted Array II — Python beats 98.40% using collections.Counter!"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - solved
    - answer
abbrlink: 73b5ce9c
category: null
docId: ryp6s59uwc10w2dywgs6f66h
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

Python's `collections.Counter()` counts elements in a list and returns a dictionary.

For example, `nums = [1, 1, 1, 2, 2, 3]` → `Counter({1: 3, 2: 2, 3: 1})`.

1. Traverse the dictionary: when `value > 2`, set `value = 2`. This caps any element appearing more than twice down to 2.
2. Convert `Counter({1: 2, 2: 2, 3: 1})` back to a list using `elements()`.

---

Since the problem passes `nums` **by reference**, we just need to clear `nums` and extend it with the modified list.

```python
from collections import Counter # import
class Solution:
    def removeDuplicates(self, nums: List[int]) -> List[int]:
        dict1 = Counter(nums)
        for i in dict1:
            if dict1[i] > 2:
                dict1[i] = 2
        list1 = list(dict1.elements())
        nums.clear() # clear the list
        nums.extend(list1) # add elements back
        return len(nums)
```

**Complexity Analysis**

Time complexity: `O(n)`, where `n` is the length of the array. We traverse the array at most once.

Space complexity: `O(1)`. We only use constant space for a few variables.
