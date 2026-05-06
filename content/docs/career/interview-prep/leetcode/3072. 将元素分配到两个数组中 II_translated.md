---
title: 3072. Allocate elements into two arrays II.md
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - Tree array
  - Thread tree
  - Array
  - simulation
abbrlink: 48a38683
docId: r12u8o7j73oxhbvgphi939fb
---

# topic：

[3072. Allocate elements into two arrays II.md](https://leetcode.cn/problems/distribute-elements-into-two-arrays-ii/description/?envType=daily-question&envId=2024-06-05)
"""

<p>Give you a bidding <strong>1</strong> start、Length <code>n</code> 的整数Array <code>nums</code> 。</p>

<p>Now define function <code>greaterCount</code> ，Make <code>greaterCount(arr, val)</code> 返回Array <code>arr</code> middle<strong> Strict</strong> <code>val</code> Number of elements。</p>

<p>You need to use <code>n</code> Secondary operation，Will <code>nums</code> 的所有元素分配到两个Array <code>arr1</code> and <code>arr2</code> middle。In the first place一Secondary operationmiddle，Will <code>nums[1]</code> Add <code>arr1</code> 。In the first place二Secondary operationmiddle，Will <code>nums[2]</code> Add <code>arr2</code> 。after，In the first place <code>i</code> Secondary operationmiddle：</p>

<ul> 
 <li>if <code>greaterCount(arr1, nums[i]) &gt; greaterCount(arr2, nums[i])</code> ，Will <code>nums[i]</code> Add <code>arr1</code> 。</li> 
 <li>if <code>greaterCount(arr1, nums[i]) &lt; greaterCount(arr2, nums[i])</code> ，Will <code>nums[i]</code> Add <code>arr2</code> 。</li> 
 <li>if <code>greaterCount(arr1, nums[i]) == greaterCount(arr2, nums[i])</code> ，Will <code>nums[i]</code> Add元素数量较少的Arraymiddle。</li> 
 <li>if仍然相等，SoWill <code>nums[i]</code> Add <code>arr1</code> 。</li> 
</ul>

<p>连接Array <code>arr1</code> and <code>arr2</code> 形成Array <code>result</code> 。For example，if <code>arr1 == [1,2,3]</code> and <code>arr2 == [4,5,6]</code> ，So <code>result = [1,2,3,4,5,6]</code> 。</p>

<p>返回整数Array <code>result</code> 。</p>

<p>&nbsp;</p>

<p>&lt;strong class="example"&gt;Exemplary example 1：</strong></p>

<pre>
<strong>enter：</strong>nums = [2,1,3,3]
<strong>Output：</strong>[2,3,1,3]
<strong>explain：</strong>exist前两Secondary operation后，arr1 = [2] ，arr2 = [1] 。
In the first place 3 Secondary operationmiddle，两个Arraymiddle大于 3 Number of elements都yes零，并and长度相等，therefore，Will nums[3] Add arr1 。
In the first place 4 Secondary operationmiddle，两个Arraymiddle大于 3 Number of elements都yes零，but arr2 Small length，therefore，Will nums[4] Add arr2 。
exist 4 Secondary operation后，arr1 = [2,3] ，arr2 = [1,3] 。
therefore，连接形成的Array result yes [2,3,1,3] 。
</pre>

<p>&lt;strong class="example"&gt;Exemplary example 2：</strong></p>

<pre>
<strong>enter：</strong>nums = [5,14,3,1,2]
<strong>Output：</strong>[5,3,1,2,14]
<strong>explain：</strong>exist前两Secondary operation后，arr1 = [5] ，arr2 = [14] 。
In the first place 3 Secondary operationmiddle，两个Arraymiddle大于 3 Number of elements都yes一，并and长度相等，therefore，Will nums[3] Add arr1 。
In the first place 4 Secondary operationmiddle，arr1 middle大于 1 Number of elements大于 arr2 middle的数量（2 &gt; 1），therefore，Will nums[4] Add arr1 。
In the first place 5 Secondary operationmiddle，arr1 middle大于 2 Number of elements大于 arr2 middle的数量（2 &gt; 1），therefore，Will nums[5] Add arr1 。
exist 5 Secondary operation后，arr1 = [5,3,1,2] ，arr2 = [14] 。
therefore，连接形成的Array result yes [5,3,1,2,14] 。
</pre>

<p>&lt;strong class="example"&gt;Exemplary example 3：</strong></p>

<pre>
<strong>enter：</strong>nums = [3,3,3,3]
<strong>Output：</strong>[3,3,3,3]
<strong>explain：</strong>exist 4 Secondary operation后，arr1 = [3,3] ，arr2 = [3,3] 。
therefore，连接形成的Array result yes [3,3,3,3] 。
</pre>

<p>&nbsp;</p>

<p><strong>hint：</strong></p>

<ul> 
 <li><code>3 &lt;= n &lt;= 10<sup>5</sup></code></li> 
 <li><code>1 &lt;= nums[i] &lt;= 10<sup>9</sup></code></li> 
</ul>

<div><div>Related Topics</div><div><li>Tree array</li><li>Thread tree</li><li>Array</li><li>simulation</li></div></div><br><div><li>👍 38</li><li>👎 0</li></div>
"""

# Thought：

1. initialization：
   首先Will nums Array反转，以便我们可以从最后一个元素start处理。这一步exist最初与学长@Angro beatICPCI learned，`pop()` Compare `pop(0)` It is much faster。
   Will反转后的第一个元素分配给 arr1 and temp1，The second element is allocated to arr2 and temp2。

2. Iteration processing each element：
   use while Traversal nums Array的剩余元素。
   For each element，use bisect.bisect_right exist arr1 and arr2 middle找到Compare当前元素小的元素的数量。
   Re -uselen(arr1)andlen(arr2)Minus this quantity，得到Compare当前元素大的元素的数量。
   然后进行Compare较To。 为了use二分查找，therefore我们要保证 arr1 and arr2 yes有序的， Pythonmiddleuse `insort()` To。
   but同时我们要维持一个答案Array，thereforeappendTo。

3. Merge answer

# Code：

```python
import bisect
from typing import List

class Solution:
    def resultArray(self, nums: List[int]) -> List[int]:
        nums = nums[::-1]
        temp = nums.pop()
        arr1 = [temp]
        temp1 = [temp]
        temp = nums.pop()
        arr2 = [temp]
        temp2 = [temp]
        while nums:
            temp = nums.pop()
            # [28] [2]
            index1 = bisect.bisect_right(arr1, temp)
            index2 = bisect.bisect_right(arr2, temp)
            length_1 = len(arr1) - index1
            length_2 = len(arr2) - index2
            if length_1 > length_2:
                bisect.insort(arr1, temp)
                temp1.append(temp)
            elif length_1 < length_2:
                bisect.insort(arr2, temp)
                temp2.append(temp)
            else:
                if len(arr1) > len(arr2):
                    bisect.insort(arr2, temp)
                    temp2.append(temp)
                else:
                    bisect.insort(arr1, temp)
                    temp1.append(temp)

        return temp1 + temp2
```
