---
title: "1234. Replace the Substring for Balanced String — Daily Problem"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: 56d97dcf
docId: p8igr19xfxnuyo2lpngnr6fg
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[1234. Replace the Substring for Balanced String](https://leetcode.cn/problems/replace-the-substring-for-balanced-string/description/)

# Approach

`all()`: returns `True` if `bool(x)` is `True` for all values `x` in the iterable. Returns `True` if the iterable is empty.

Two pointers in the same direction — the elegant solution for this problem.

If every character in the string appears exactly `n/4` times, then it is a "balanced string."

If any character **outside** the substring to be replaced appears more than $m = \dfrac{n}{4}$ times, then no matter how you replace the substring, you cannot make that character's count equal to `m`.

Conversely, if every character **outside** the substring appears at most `m` times:

> Then a replacement exists that makes `s` a balanced string, where each character appears exactly `m` times.
> For this problem, let the left and right endpoints of the substring be `left` and `right`. Enumerate `right`:
> if every character outside the substring has count ≤ m, then the substring from `left` to `right` is a valid replacement. Its length is `right − left + 1`.
> Update the minimum answer, then move `left` right to shrink the substring length.

# Code

```python
class Solution:
    def balancedString(self, s: str) -> int:
        s_c = Counter(s)
        n = len(s)
        if all(s_c[v] <= n//4 for v in s_c):
            return 0
        ans, left = inf, 0
        # enumerate right endpoint
        for i, j in enumerate(s):
            s_c[j] -= 1
            while all(s_c[v] <= n // 4 for v in s_c):
                ans = min(ans, i - left + 1)
                s_c[s[left]] += 1
                left += 1
        return ans

```

```go
func balancedString(s string) int {
	cnt, m := ['X']int{}, len(s)/4
	for _, c := range s {
		cnt[c]++
	}
	if cnt['Q'] == m && cnt['W'] == m && cnt['E'] == m && cnt['R'] == m {
		return 0
	}
	ans, left := len(s), 0
	for right, c := range s {
		cnt[c]--
		for cnt['Q'] <= m && cnt['W'] <= m && cnt['E'] <= m && cnt['R'] <= m {
			ans = min(ans, right-left+1)
			cnt[s[left]]++
			left++
		}
	}
	return ans
}
func min(a, b int) int { if a > b { return b }; return a }
```
