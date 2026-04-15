---
title: "2341. Maximum Number of Pairs in Array — Daily Problem"
tags:
  - - Python
  - - answer
abbrlink: f953c753
date: "2024.01.01 0:00"
docId: s3w19zdm6yhkhj4o0ba3kbal
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[2341. Maximum Number of Pairs in Array](https://leetcode.cn/problems/maximum-number-of-pairs-in-array/description/)

# Approach

## My Approach

Not sure if it was seeing the word "Easy" that made me go for the optimal solution right away. Actually, ylb's hash table approach is still faster here. Sort the list and check pairs by scanning adjacent equal elements.

## Hash Table Approach

After counting with `Counter`, use `a += v // 2` and `b += v % 2`. For each number `x` with count `v`:

- If `v >= 1`, we can form `v // 2` pairs from the `x` values in the array.
- Accumulate this count into variable `a`.

# Code

```python Simple counting
class Solution:
    def numberOfPairs(self, nums: List[int]) -> List[int]:
        nums.sort()
        ans = [0, len(nums)]
        for index in range(1, len(nums)):
            if nums[index - 1] == nums[index]:
                ans[0] += 1
                ans[1] -= 2
                nums[index - 1] = nums[index] = -1
        return ans
```

```python Hash table
class Solution:
    def numberOfPairs(self, nums: List[int]) -> List[int]:
        x = Counter(nums)
        a = 0
        b = 0
        for k,v in x.items():
            a+=v//2
            b+=v%2
        return [a,b]
```
