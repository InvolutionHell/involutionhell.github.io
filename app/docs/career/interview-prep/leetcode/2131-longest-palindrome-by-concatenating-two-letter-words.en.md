---
title: "2131. Longest Palindrome by Concatenating Two Letter Words"
date: "2025/5/25-2:33"
tags:
  - - Python
  - - Answer
abbrlink: 9fa195e5
docId: ksw2vic4alf1tdnnueay81g8
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[2131. Longest Palindrome by Concatenating Two Letter Words](https://leetcode.cn/problems/longest-palindrome-by-concatenating-two-letter-words/description/?envType=daily-question&envId=2025-05-25)

# Approach

The idea comes from the brilliant ling-nc.

We build a hash map to count the occurrences of each word.

For each word, we check whether its reverse exists in the hash map. If it does, they can form a palindrome pair — we update the result and decrease the corresponding count. If the reverse does not exist, we increment the count for the current word. Finally, we check if there's any palindromic word that can be used as the center of the palindrome.

Example:

1. Input: `["lc", "cl", "gg", "gg"]`

2. `"lc"` has no pair → stored in the map: `{ "lc": 1 }`

3. `"cl"` finds `"lc"` exists → use `"lc" + "cl"` as a pair → `res += 4` → map updated to `{ "lc": 0 }`

4. `"gg"` has no pair → stored in the map: `{ "lc": 0, "gg": 1 }`

5. Second `"gg"` finds `"gg"` exists → use `"gg" + "gg"` as a pair → `res += 4` → map becomes `{ "lc": 0, "gg": 0 }`

   Then we check whether the hash map contains any palindromic word (i.e., a word with two identical characters) that can be used as the center of the final palindrome string. If such a word exists, we can add 2 more to the result.

6. Finding a center word (can only pick one symmetric word)
   In this example, all `"gg"` words have been paired, so none is left → no center word is added.

# Code

```python
from collections import defaultdict
from typing import List
class Solution:
    def longestPalindrome(self, words: List[str]) -> int:
        count = defaultdict(int)
        res = 0
        for word in words:
            if count[word[::-1]] > 0:
                count[word[::-1]] -= 1
                res += 4
            else:
                count[word] += 1
        for key, value in count.items():
            if key[0] == key[1] and value > 0:
                res += 2
                break
        return res
```

```typescript
function longestPalindrome(words: string[]): number {
  const count: Map<string, number> = new Map();
  let res = 0;

  for (const word of words) {
    const reversed = word.split("").reverse().join("");
    const reversedCount = count.get(reversed) ?? 0;

    if (reversedCount > 0) {
      count.set(reversed, reversedCount - 1);
      res += 2 * word.length;
    } else {
      count.set(word, (count.get(word) ?? 0) + 1);
    }
  }

  for (const [word, freq] of count.entries()) {
    if (word === word.split("").reverse().join("") && freq > 0) {
      res += word.length;
      break; // only one palindromic center allowed
    }
  }

  return res;
}
```
