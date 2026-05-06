---
title: "76. Minimum Window Substring"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - difficulty
abbrlink: ae10d3c1
docId: l358imxaj1mmtth6dydvu54s
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[76. Minimum Window Substring](https://leetcode.cn/problems/minimum-window-substring/description/)

# Approach

- When `t`'s elements are not all present: move right pointer right
- When all of `t`'s elements are present: move left pointer right; if right pointer hasn't reached the end, continue moving right pointer
- If `t` is found: break and restart

## Optimization

> The code finds the minimum length window in string `s` that contains all characters in string `t`. It uses two pointers, `left` and `right`, to traverse `s` and track the window. The `isAll` function checks if all characters in `t` are present in the current window.
> Improvements:
>
> - Use a `dict_keys` dictionary instead of `isAll` to track character counts in the current window, updating directly instead of calling `Counter` repeatedly.
> - Remove unused variables `ans`, `hash_1`, `dict_t`.
> - Initialize `right` outside the loop, and use `while right < len(s) and not isAll(dict_keys, dict_t)` to terminate when all characters in `t` are found.
> - Track the minimum window length and the start/end indices, return `s[start:end+1]` at the end.

**`get()` method syntax:**

`dict.get(key[, value])`

**Parameters:**

- `key` — the key to look up.
- `value` — optional, the default to return if the key doesn't exist.

**Return value:** Returns the value for the key, or `None` (or the default) if not found.

# Code

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
            dict1 = Counter(s[left:right + 1])
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
        # store character counts in t
        dict_t = Counter(t)
        # store characters in current sliding window
        dict_keys = {}
        left = 0
        right = 0
        min_len = float('inf')
        start = 0
        end = 0
        while right < len(s):
            # if the current character is in t, add it to the window dict
            if s[right] in dict_t:
                dict_keys[s[right]] = dict_keys.get(s[right], 0) + 1
            # if the current window contains all characters in t
            while right < len(s) and isAll(dict_keys, dict_t):
                if right - left + 1 < min_len:
                    min_len = right - left + 1
                    start = left
                    end = right
                # move left pointer right, remove character from window dict
                if s[left] in dict_keys:
                    dict_keys[s[left]] -= 1
                    if dict_keys[s[left]] == 0:
                        del dict_keys[s[left]]
                left += 1
            right += 1
        return s[start:end + 1] if min_len != float('inf') else ""

def isAll(dict_keys, target):
    for key in target:
        if key not in dict_keys or dict_keys[key] < target[key]:
            return False
    return True
```
