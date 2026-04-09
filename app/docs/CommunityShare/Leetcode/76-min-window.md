---
title: 76Minimum cover string.md
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - difficulty
abbrlink: ae10d3c1
docId: l358imxaj1mmtth6dydvu54s
---

# topic：

[76. Minimum cover string](https://leetcode.cn/problems/minimum-window-substring/description/)

# Thought：

Not existtWhen all elements are，Right shift right shift
ExisttWhen all elements are，Left finger shift right，If the right pointer does not reach the far right，Continue to move the right pointer
If you findt，Jump back

## optimization：

> The code finds the minimum length window in string s that contains all the characters in string t. The code uses two pointers, left and right, to traverse s and keep track of the window. The isAll function checks if the characters in t are present in the current window.
> To improve the code, consider the following:
> Use a dict dict_keys instead of the isAll function to track the count of each character in the current window, and update the count directly instead of using Counter function repeatedly.
> Remove unused variables ans, hash_1, and dict_t.
> Initialize right outside the loop, and use while right &lt; len(s) and not isAll(dict_keys, dict_t) as the loop condition to terminate when all characters in t are present in the current window.
> &gt; Keep track of the minimum window length and the start and end indices of the window, and return s[start:end + 1] at the end.
> get()Method grammar：

`dict.get(key[, value]) `

### parameter

    key -- The key to find in the dictionary。
    value -- Optional，If the value of the specified key does not exist，Back to the default value。
    return value
    Return to the value of the specified key，If the key is not in the dictionary, the silent recognition value None Or the default value set。

### Instance

    以下Instance展示了 get() How to use the function：

### Instance

    ```python
    #!/usr/bin/python
    # -*- coding: UTF-8 -*-

    tinydict = {'Name': 'Runoob', 'Age': 27}

    print ("Age : %s" %  tinydict.get('Age'))

    # no setting Sex，也no setting默认的值，Output None
    print ("Sex : %s" %  tinydict.get('Sex'))

    # no setting Salary，Output默认的值  0.0
    print ('Salary: %s' % tinydict.get('Salary', 0.0))
    ```

# Code：

```python Mine
class Solution:
    def minWindow(self, s: str, t: str) -> str:
        ans = 1000001
        hash_1 = {}

        def isAll(dict_keys, target):
            for i in target:
                if i not in dict_keys:
                    return False
                else:
                    if dict_keys[i] < target[i]:
                        return False
            return True

        dict_t = Counter(t)
        left = 0
        right = 0
        while right < len(s):
            # Not existtWhen all elements are，Right shift right shift
            # ExisttWhen all elements are，Left finger shift right，If the right pointer does not reach the far right，Continue to move the right pointer
            # If you findt，Jump back
            dict1 = Counter(s[left:right + 1])
            # If there is any element
            if isAll(dict1, dict_t):
                ans = min(ans, right - left + 1)
                hash_1[right - left + 1] = s[left:right+1]
                print(ans, hash_1)
                left += 1
            else:
                right += 1
            print(ans, hash_1, dict1.keys())
        return hash_1[ans] if len(hash_1) != 0 else ""
```

```python
class Solution:
    def minWindow(self, s: str, t: str) -> str:
        # storagetThe number of each character in the string
        dict_t = Counter(t)
        # storage当前滑动窗口middle的字符
        dict_keys = {}
        # Left pointer and right pointer
        left = 0
        right = 0
        # Record minimum length
        min_len = float('inf')
        # Record the starting position and end of the shortest string
        start = 0
        end = 0
        # Right pointer0arrivelen(s) - 1Slide
        while right < len(s):
            # If the current character is intmiddle，则把它加入当前滑动窗口的字典middle
            if s[right] in dict_t:
                dict_keys[s[right]] = dict_keys.get(s[right], 0) + 1
            # 如果当前滑动窗口middle包含了tmiddle的所有字符
            while right < len(s) and isAll(dict_keys, dict_t):
                # If the current length is less than the minimum length of the previous record，Update the minimum length and start position and end position
                if right - left + 1 < min_len:
                    min_len = right - left + 1
                    start = left
                    end = right
                # Left finger shift right，把当前字符从当前滑动窗口的字典middle移除
                if s[left] in dict_keys:
                    dict_keys[s[left]] -= 1
                    if dict_keys[s[left]] == 0:
                        del dict_keys[s[left]]
                left += 1
            right += 1
        # Return to the shortest string，If not, return the empty string
        return s[start:end + 1] if min_len != float('inf') else ""

def isAll(dict_keys, target):
    for key in target:
        if key not in dict_keys or dict_keys[key] < target[key]:
            return False
    return True
```
