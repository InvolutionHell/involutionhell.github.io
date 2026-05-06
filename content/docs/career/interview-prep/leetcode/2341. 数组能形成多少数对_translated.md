---
title: 2341. How much can the array be formed  One question daily
tags:
  - - Python
  - - answer
abbrlink: f953c753
date: "2024.01.01 0:00"
docId: s3w19zdm6yhkhj4o0ba3kbal
---

# topic：

[2341. How much can the array be formed.md](https://leetcode.cn/problems/maximum-number-of-pairs-in-array/description/)

# Thought：

## I am：

I don't know if I saw it“Simple”Two words，This question has the initiative to think about the optimal solution。Actually this timeylbBig guy's hash table method is still fast。
Sort the list，Whether two or two are equal to whether。

## Hash tableThought：

CounterAfter counting，`a+=v//2`,`b+=v%2`For each number x，
if x Number of times v more than the 1，You can choose two from the array x Form a number pair，we willv Divide 2 Take down，
You can get the current number x Number pairs that can be formed，Then we accumulate this number to the variable s middle。

# Code：

```python Ordinary count
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
