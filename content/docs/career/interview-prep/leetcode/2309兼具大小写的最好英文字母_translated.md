---
title: >-
  2309. The best English letters with both appropriates and lowercases One
  question daily
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - One question daily
  - - Bit operation
  - - Hash table
  - - C++
abbrlink: b4953d62
docId: mc2rjsq7syibclikyhomsbft
---

[2309. The best English letters with both appropriates and lowercases](https://leetcode.cn/problems/greatest-english-letter-in-upper-and-lower-case/description/)

# Thought：

1. Hash table：The first thing to think of the question is to solve it with a dictionary。But find that you can directly traverse the alphabet，fromZStart looking for，See if the applause exists，Just return directly。

_Running time exceeds99.9%_ 2. Bit operation：We can use two integers mask1 and mask2 Record string separately s 中出现的小写字母and大写字母，in mask1 First i
Position representation i Does a lowercase letter appear，and mask2 First i Position representation i Whether an uppercase letter appears。

Then we will mask1 and mask2 Perform and calculate，The results obtained mask First i Position representation i Whether the lethals of the letter appear at the same time。

As long as you get mask The highest level of binary representation 1 s position，Convert it to the corresponding capital letter。If all binary positions are not 1，Explain that there is no letter that appears at the same time,，Return to an empty string。

> author：ylb
> Link：https://leetcode.cn/problems/greatest-english-letter-in-upper-and-lower-case/solutions/2077636/by-lcbin-zbg0/
> source：Deduction（LeetCode）
> 著作权归author所有。商业转载请联系author获得授权，Non -commercial reprint Please indicate the source。

# Code：

```python Traversing the alphabet
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

```python Bit operation
class Solution:
    def greatestLetter(self, s: str) -> str:
        # We can use two integers mask1 and mask2
        # Record string separately s 中出现的小写字母and大写字母，in mask1 First i Position representation i Does a lowercase letter appear，
            # and mask2 First i Position representation i Whether an uppercase letter appears。
        mask1 = mask2 = 0
        for i in s:
            if i.islower():
                mask1 |= 1 << (ord(i) - ord("a"))
            else:
                mask2 |= 1 << (ord(i) - ord("A"))
        mask = mask1 & mask2
        return chr(mask.bit_length() - 1 + ord("A")) if mask else ""
```
