---
title: 1333.Restaurant filter
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - Sort
  - Array
abbrlink: 7f1331bc
docId: jcqhknk5z2xr3rfqn49me4j9
---

# topic：

[1333.Restaurant filter.md](https://leetcode-cn.com/problems/filter-restaurants-by-vegan-friendly-price-and-distance/)

# Thought：

This is the beginningpopThought，But time complexity is too high，400ms，It is later changed to a list derivative。
I think of the senior said，pop()The running time is okay，But once the index is added inside，It will be particularly slow。
sorted and lambda Usage：
lambdayesPythonAnonymous function in。it's here，lambda x: (x[1], x[0])Definitions a acceptance of an elementx（in this case，xyesrestaurantsA list in the list）And return a tuple(x[1], x[0])The function。

this means，Sort首先基于每个子列表的第二个元素x[1]，Then based on this basisx[0]。in other words，It first followsx[1]进行Sort，ifx[1]same，According tox[0]进行Sort。

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

# Code：

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
