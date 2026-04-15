---
title: "1545. Find Kth Bit in Nth Binary String"
date: "2026.03.04 00:46"
tags:
  - Leetcode
  - answer
  - Math
  - String
docId: zuoplhoodv7tzfgku0pwzi6w
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

Given two positive integers `n` and `k`, the binary string `Sn` is formed as follows:

- `S1 = "0"`
- When `i > 1`: `Si = Si-1 + "1" + reverse(invert(Si-1))`

where `+` denotes concatenation, `reverse(x)` returns the string `x` reversed, and `invert(x)` flips every bit in `x` (0 becomes 1, 1 becomes 0).

The first 4 strings in the sequence are:

- `S1 = "0"`
- `S2 = "011"`
- `S3 = "0111001"`
- `S4 = "011100110110001"`

Return the `k`-th character of `Sn`. It is guaranteed that `k` is within the length of `Sn`.

# Solution

I first tried the brute-force approach — generate `Sn` directly — but found that for large `n`, `Sn` becomes extremely long and causes memory overflow.

```javascript
/**
 * @param {number} n
 * @param {number} k
 * @return {character}
 */
var findKthBit = function (n, k) {
  var reverseR = function (input) {
    return input
      .split("") // split into array ["0", "1", "1", "1", "0"]
      .map((char) => char ^ 1) // flip each bit: [1, 0, 0, 0, 1]
      .reverse() // reverse the array: [1, 0, 0, 0, 1]
      .join(""); // join back to string "10001"
  };
  let S = "0";
  for (let i = 1; i < n; i++) {
    S = S + "1" + reverseR(S);
  }
  return S[k - 1];
};
```

Then I tried the mathematical flip approach. Observing $S_i = S_{i-1} + "1" + \text{reverse}(\text{invert}(S_{i-1}))$:

**Length rule:** $|S_n| = 2^n - 1$.

- $S_1$: length $2^1-1=1$, middle bit is position 1.
- $S_2$: length $2^2-1=3$, middle bit is position 2.
- $S_3$: length $2^3-1=7$, middle bit is position 4.

**Three cases:**

- **Left half** ($k &lt; \text{mid}$): This is a copy of $S_{n-1}$. Recurse: "what is the $k$-th bit of $S_{n-1}$?"
- **Middle** ($k = \text{mid}$): By the construction formula, this bit is always `"1"`.
- **Right half** ($k &gt; \text{mid}$): The right portion is the reversed invert of $S_{n-1}$.

Due to the **reverse**, the 1st character of the right half corresponds to the last character of the left half, and so on.

Mapping formula: $S_n[k] = \text{invert}(S_{n-1}[2^n - k])$.

For example, to find the 6th bit of $S_3$ (length 7), it corresponds to the invert of the $2^3 - 6 = 2$nd bit of $S_2$.

```javascript
var findKthBit = function (n, k) {
  let flip = false; // track the number of inversions needed
  while (n > 1) {
    let mid = 1 << (n - 1); // 2^(n-1)
    if (k === mid) {
      // middle bit is always 1
      let res = 1;
      return (flip ? res ^ 1 : res).toString();
    } else if (k > mid) {
      // if on the right side, mirror to the left and add one inversion
      k = 2 * mid - k;
      flip = !flip;
    }
    // if on the left side, just look at n-1
    n--;
  }
  // finally back to S1, which is "0"
  let res = 0;
  return (flip ? res ^ 1 : res).toString();
};
```

## Why is `mid` equal to $2^{n-1}$?

We can derive the center position (mid) from the total length of $S_n$.

**Calculate the length $L_n$ of $S_n$:**

- $S_1 = "0"$, so $L_1 = 1$
- $S_n = S_{n-1} + "1" + \text{modified } S_{n-1}$

Length recurrence: $L_n = 2 \times L_{n-1} + 1$

Examples:

- $L_1 = 1$
- $L_2 = 3$
- $L_3 = 7$
- $L_4 = 15$

Pattern: $L_n = 2^n - 1$

## Why does this approach work?

Think of it like finding a specific point on an infinitely folded tape:

- **Brute force**: Fold the paper 20 times, unroll the tape, count from the beginning to position $k$.
- **This approach (backtracking/iteration)**: Look at the already-folded paper ($S_n$) and ask: is position $k$ on the left or right of the fold?
  - If right: mirror it to the left (symmetric transform) and mark it as flipped once (`flip = !flip`).
  - If left: just look at the left side.
  - The paper halves in size (`n--`). Repeat until hitting a fold point (`k === mid`) or shrinking to size 1 (`n=1`).

## If on the right side and `S[k]=0`, does flipping it over mean `S[k]=1`?

According to the problem, the right half of $S_i$ is: $\text{reverse}(\text{invert}(S_{i-1}))$. Two operations:

- **Invert**: $0 \to 1$, $1 \to 0$.
- **Reverse**: positions are mirrored.

So if we see a 0 in the right half and trace back through both operations:

- Because it was inverted: it was 1 before inversion.
- Because it was reversed: it corresponds to the symmetric position on the left half.
