---
title: "2309. Greatest English Letter in Upper and Lower Case — Daily Problem"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - Daily problem
  - - Bit operation
  - - Hash table
  - - C++
abbrlink: b4953d62
docId: mc2rjsq7syibclikyhomsbft
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

[2309. Greatest English Letter in Upper and Lower Case](https://leetcode.cn/problems/greatest-english-letter-in-upper-and-lower-case/description/)

# Approach

1. **Hash table:** The first approach that comes to mind is using a dictionary. But it turns out we can directly traverse the alphabet from `Z` downward, check if both cases exist, and return immediately.

_Runtime beats 99.9%_

2. **Bit manipulation:** We use two integers `mask1` and `mask2` to record which lowercase and uppercase letters appear in string `s`. In `mask1`, bit `i` represents whether lowercase letter `i` appears; in `mask2`, bit `i` represents whether uppercase letter `i` appears.

We then perform a bitwise AND of `mask1` and `mask2`. The result `mask` has bit `i` set only if both cases of letter `i` appear.

We find the highest set bit in `mask` and convert it to the corresponding uppercase letter. If no bit is set, return an empty string.

> Author: ylb  
> Link: https://leetcode.cn/problems/greatest-english-letter-in-upper-and-lower-case/solutions/2077636/by-lcbin-zbg0/  
> Source: LeetCode  
> All rights reserved by the author. Commercial use requires authorization; non-commercial use must cite the source.

# Code

```python Traverse the alphabet
class Solution:
    def greatestLetter(self, s: str) -> str:
        for i in range(90, 64, -1):
            if chr(i) in s and chr(i+32) in s:
                return chr(i)
        return ""
```

```cpp Hash table
class Solution {
public:
    string greatestLetter(string s) {
        unordered_set<char> strin(s.begin(),s.end());
        for(char c = 'Z'; c >= 'A'; --c){
            if(strin.count(c) && strin.count(char(c+32))){
                return string(1,c);
            }
        }
        return "";
    }
};
```

```python Bit manipulation
class Solution:
    def greatestLetter(self, s: str) -> str:
        # Use two integers mask1 and mask2 to record lowercase and uppercase letters in s
        # In mask1, bit i represents whether lowercase letter i appears;
        # In mask2, bit i represents whether uppercase letter i appears.
        mask1 = mask2 = 0
        for i in s:
            if i.islower():
                mask1 |= 1 << (ord(i) - ord("a"))
            else:
                mask2 |= 1 << (ord(i) - ord("A"))
        mask = mask1 & mask2
        return chr(mask.bit_length() - 1 + ord("A")) if mask else ""
```
