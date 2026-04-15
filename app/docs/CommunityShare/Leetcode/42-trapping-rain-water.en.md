---
title: "42. Trapping Rain Water"
date: "2025/3/27-19:56"
tags:
  - - Python
  - - Answer
abbrlink: 60fe0230
docId: jv8qj3ljyr2uomaehnv0l77k
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[42. Trapping Rain Water](https://leetcode.cn/problems/trapping-rain-water/)

# Approach

This is a problem I've memorized inside out — totally muscle memory. But I revisited it yesterday and tried to actually understand it. I even made a GIF to help myself visualize what's happening. Here's the code:

Let's use the example: `[0,1,0,2,1,0,1,3,2,1,2,1]`

The core idea is basically the "bucket theory": we treat the two outermost bars as the "Walls of Maria" — and ignore the inner ones for now. The max height of water we can hold is `min(leftmax, rightmax)`. In other words, the shorter wall decides the water level.

But height alone isn't enough — we also need width to compute the actual amount of water. So we look at each bar one by one and calculate how much water we can trap on top of it, then sum it all up.

We use two pointers: `left` and `right`, and also keep track of the highest wall on the left (`leftmax`) and on the right (`rightmax`).

Take this specific frame as an example: at this point, the max water we can hold is `leftmax = 2`, but the current column has height `1`, so we can trap `2 - 1 = 1` unit of water.

If we compared `leftmax` and `rightmax` directly, we wouldn't know why this particular column can hold water. The only reason it can trap water is because its height is less than or equal to `leftmax`.

在做这道题的时候，完全背诵下来了。但是昨天重新理解了一下，画了一个 GIF 图供自己理解。核心思想是木桶原理：把最外面的两根柱子视作边界，那么最多能装 `min(leftmax, rightmax)` 高的水。我们一根柱子一根柱子地看，计算每 "1" 个宽度能装多少水，然后加起来即可。

# Code

```python
class Solution:
    def trap(self, height: list[int]) -> int:
        ans = leftmost = rightmost = 0
        left, right = 0, len(height) - 1
        while left < right:
            leftmost = max(leftmost, height[left])
            rightmost = max(rightmost, height[right])
            if leftmost <= rightmost:
                ans += leftmost - height[left]
                left += 1
            else:
                ans += rightmost - height[right]
                right -= 1
        return ans
```

```python
import matplotlib.pyplot as plt
import matplotlib.animation as animation
import numpy as np

# Given height list for illustration
height = [0,1,0,2,1,0,1,3,2,1,2,1]

# Initialize variables as in the function
left, right = 0, len(height) - 1
leftmax = rightmax = 0
ans = 0

# For animation, store each frame's water level and pointers
frames = []

# Simulate the logic and capture frames
while left < right:
    leftmax = max(leftmax, height[left])
    rightmax = max(rightmax, height[right])
    water = [0] * len(height)
    if leftmax <= rightmax:
        trapped = max(0, leftmax - height[left])
        ans += trapped
        water[left] = trapped
        frames.append((height.copy(), water.copy(), left, right))
        left += 1
    else:
        trapped = max(0, rightmax - height[right])
        ans += trapped
        water[right] = trapped
        frames.append((height.copy(), water.copy(), left, right))
        right -= 1

# Create animation
fig, ax = plt.subplots(figsize=(10, 5))

def update(frame):
    ax.clear()
    heights, water, l_ptr, r_ptr = frame
    indices = np.arange(len(heights))
    ax.bar(indices, heights, color='grey', edgecolor='black')
    ax.bar(indices, water, bottom=heights, color='blue', edgecolor='blue', alpha=0.6)
    ax.axvline(l_ptr, color='green', linestyle='--', label='Left Pointer')
    ax.axvline(r_ptr, color='red', linestyle='--', label='Right Pointer')
    ax.set_ylim(0, max(height) + 3)
    ax.set_title("Trapping Rain Water Animation")
    ax.legend()

ani = animation.FuncAnimation(fig, update, frames=frames, interval=500, repeat=False)

from IPython.display import HTML
ani.save("trapping_rain_water.gif", writer="pillow", fps=2)  # save as GIF
```
