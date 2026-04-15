---
title: "1333. Filter Restaurants by Vegan-Friendly, Price, and Distance"
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - Sort
  - Array
abbrlink: 7f1331bc
docId: jcqhknk5z2xr3rfqn49me4j9
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[1333. Filter Restaurants by Vegan-Friendly, Price, and Distance](https://leetcode-cn.com/problems/filter-restaurants-by-vegan-friendly-price-and-distance/)

# Approach

My initial approach used `pop()`, but the time complexity was too high (~400ms). I switched to a list comprehension.

A senior once told me: `pop()` runtime is fine, but when you combine it with index operations inside, it becomes very slow.

**`sorted` and `lambda` usage:**

`lambda` is Python's anonymous function syntax. Here, `lambda x: (x[1], x[0])` defines a function that takes an element `x` (a sublist of `restaurants`) and returns a tuple `(x[1], x[0])`.

This means sorting is first based on `x[1]` (rating), then by `x[0]` (id) if `x[1]` values are equal.

```python
while ind < len(restaurants):
     i = restaurants[ind]
     if veganFriendly == 1 and i[2] == 0:
         restaurants.pop(ind)
     elif maxPrice < i[3]:
         restaurants.pop(ind)
     elif maxDistance < i[4]:
         restaurants.pop(ind)
     else:
         ind += 1
```

# Code

```python
class Solution:
    def filterRestaurants(self, restaurants: List[List[int]], veganFriendly: int, maxPrice: int, maxDistance: int) -> \
            List[int]:
        restaurants = [
            i for i in restaurants
            if (veganFriendly == 0 or i[2] == veganFriendly)
               and i[3] <= maxPrice
               and i[4] <= maxDistance
        ]
        restaurants = sorted(restaurants, key=lambda x: (x[1], x[0]), reverse=True)
        return [i[0] for i in restaurants]
```
