---
title: 1234. Replace the sub -string to get a balanced string One question daily
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: 56d97dcf
docId: p8igr19xfxnuyo2lpngnr6fg
---

# topic：

[1234. Replace the sub -string to get a balanced string.md](https://leetcode.cn/problems/replace-the-substring-for-balanced-string/description/)

# Thought：

`all()`:if bool(x) For all the values ​​in iterative objects x All for True，Then return True。 if可迭代对象为空，Then return True。

Tongxiang dual pointer，The solution of the spiritual god of this question。
If in this string，These four characters happen just to appear n/4 Second-rate，Then it is one「Balanced string」。
if在待替换子串之外的任意字符的出现Second-rate数都**Exceed** $m=\dfrac{n}{4}$
，So no matter how you replace it，都无法make这个字符的出现Second-rate数等于m。
on the other hand，if在待替换子串之外的任意字符的出现Second-rate数都**不Exceed** m，

> So it can be replaced ，make s 为Balanced string，即每个字符的出现Second-rate数均为 m。
> For this question，The left and right end points of the sub -string are left and right，enumerate right，
> if子串外的任意字符的出现Second-rate数都不Exceedm，The explanation from left arrive
> rightThis sub -string can be to replace the sub -string，Length right−left+1
> Update the minimum value of the answer，Move to the right left，Sumid sub -string length。

# Code：

```python
class Solution:
    def balancedString(self, s: str) -> int:
        s_c = Counter(s)
        n = len(s)
        if all(s_c[v] <= n//4 for v in s_c):
            return 0
        ans, left = inf, 0
        # enumerate右端点
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
