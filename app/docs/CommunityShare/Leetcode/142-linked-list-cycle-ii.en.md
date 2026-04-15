---
title: "142. Linked List Cycle II"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: e2c9cca9
docId: ylpucy1rbbnfpe3t62u8kcfq
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

[142. Linked List Cycle II](https://leetcode.cn/problems/linked-list-cycle-ii/)

# Approach

### Problem Analysis

This type of linked list problem is generally solved using the two-pointer technique — for example, finding the node at distance K from the tail, finding the cycle entrance, or finding the intersection node.

### Algorithm

1. **First meeting of two pointers:** Set two pointers `fast` and `slow` both pointing to `head`. `fast` moves 2 steps per round, `slow` moves 1 step per round.

   a. **Case 1:** If `fast` reaches the end of the list, the list has no cycle — return `null`.

   **Tip:** If there is a cycle, the two pointers will definitely meet. Each round, the gap between `fast` and `slow` decreases by 1, so `fast` will eventually catch `slow`.

   b. **Case 2:** When `fast == slow`, the two pointers **meet for the first time inside the cycle**. Let's analyze the steps taken:

   Suppose the list has `a + b` nodes in total, with `a` nodes from the head to the cycle entrance (not counting the entrance node), and `b` nodes in the cycle. Let `f` and `s` be the steps taken by each pointer:
   - `fast` travels twice the steps of `slow`: `f = 2s`
   - `fast` travels `n` extra cycles compared to `slow`: `f = s + nb`
   - From the above: `f = 2nb`, `s = nb` — both pointers have walked an integer multiple of the cycle length.

2. **Current situation analysis:**

   If a pointer walks `k` steps from `head`, it reaches the cycle entrance when `k = a + nb` (after `a` steps it reaches the entrance; each additional cycle of `b` steps brings it back to the entrance).

   Currently, `slow` has walked `nb` steps. So we just need `slow` to walk `a` more steps to reach the cycle entrance.

   But we don't know `a`. We use a second pointer starting from `head`. When this pointer and `slow` both walk `a` steps together, they meet exactly at the cycle entrance.

3. **Second meeting of two pointers:**
   Keep `slow` in place, reset `fast` to `head`. Both move forward 1 step per round.

   When `fast` has walked `a` steps: `slow` has walked `a + nb` steps. The two pointers meet and both point to the **cycle entrance**.

4. Return the node pointed to by `slow`.

### Complexity Analysis

**Time complexity O(N):** In the second encounter, the slow pointer walks `a < a + b` steps. In the first encounter, the slow pointer walks `a + b − x < a + b` steps (where `x` is the distance from the meeting point to the entrance). The overall complexity is linear.

**Space complexity O(1):** The two pointers use constant extra space.

# Code

```python
class Solution:
    def detectCycle(self, head: Optional[ListNode]) -> Optional[ListNode]:
        a = head
        b = head
        while True:
            if not b or not b.next:
                return None
            a = a.next
            b = b.next.next
            if b == a:
                break
        b = head
        while a != b:
            a, b = a.next, b.next
        return b
```

```cpp
class Solution {
public:
    ListNode *detectCycle(ListNode *head) {
        ListNode *a = head;
        ListNode *b = head;
        while (true) {
            if (!b or !b->next) {
                return nullptr;
            }
            a = a->next;
            b = b->next->next;
            // because b moves two steps each time, a and b must meet
            if (a == b) {
                break;
            }
        }
        // After meeting, keep a in place, reset b to head
        b = head;
        while(a!=b){
            a = a->next;
            b = b->next;
        }

        return a;
    }
};
```
