---
title: 42.md
date: "2025/3/27-19:56"
tags:
  - - Python
  - - Answer
abbrlink: 60fe0230
docId: jv8qj3ljyr2uomaehnv0l77k
---

# QUESTION：

[42.md]()

# My Think：

滚瓜烂熟的一道题, 全部靠背诵. 但是昨天又理解了一下, 画了一个GIF图供我自己理解, 代码如下,

图片举例: `[0,1,0,2,1,0,1,3,2,1,2,1]`
该题的核心思想其实就是木桶原理, 我们将最外面的两个柱子视作玛丽亚之墙, 这个时候我们忽略玛丽亚之墙内部的城墙, 那么最多是不是可以装`min(leftmax, rightmax)`这么高的水呢?
也就是最短的柱子的水决定了它的"高度". 但是我们想知道最多能装多少水, 还需要一个宽度. 于是这个时候我们就一根一根柱子看, 也就是说我们计算每"1"个宽度能装多少水, 然后加起来即可.
我们的左指针为`left`, 右指针为`right`, 我们再维护一个左边最高和右边最高.
当我们到达最外面的玛丽亚之墙的时候, 左最高即为`leftmax`, 右最高即为`rightmax`, 这个时候我们是无法判断可以装多少水的.
一直到`leftmost`!=`rightmost`的时候, 我们就可以判断了.

比如这一帧, 我们最多能装的是`leftmax`的水量, 即`2`, 但是因为我们这个时候左指针所在的柱子有一定高度`1`, 所以是`2-1=1`, 也就是我们能装`1`的水.
如果我们比较的不是`leftmost`和`rightmost`, 而是`leftmax`和`rightmax`, 我们就无法确定说这一个柱子为什么能够兜得住水, 它之所以能兜住水,必然是<=`leftmax`的

This is a problem I’ve memorized inside out — totally muscle memory. But I revisited it yesterday and tried to actually understand it. I even made a GIF to help myself visualize what's happening. Here's the code:

Let's use the example: [0,1,0,2,1,0,1,3,2,1,2,1]

The core idea of this problem is basically the "bucket theory":
We treat the two outermost bars as the "Walls of Maria" — and ignore the inner ones for now.
If that's the case, then the max height of water we can hold is min(leftmax, rightmax).
In other words, the shorter wall decides the water level.

But height alone isn’t enough — we also need width to compute the actual amount of water.
So we look at each bar one by one, and calculate how much water we can trap on top of it, then sum it all up.

We use two pointers: left and right, and also keep track of the highest wall on the left (leftmax) and the highest wall on the right (rightmax).

When our pointer reaches the end of the string (or the two walls meet), that means we’ve gone through all the characters — that’s when we know we have a valid answer.

Take this specific frame as an example:

At this point, the max water we can hold is leftmax = 2, but the current column has height 1, so we can trap:

`2 - 1 = 1` unit of water.

If we were comparing leftmax and rightmax directly, we wouldn’t know why this particular column can hold water. The only reason it can trap water is because its height is less than or equal to leftmax.

# Code：

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
ani.save("trapping_rain_water.gif", writer="pillow", fps=2)  # 保存为 GIF
```
