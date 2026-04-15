---
title: "Sword Offer II 021. Remove the Nth Node From End of List"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: 3ed2f01c
docId: qfvqmc1exp066falnsg97c5m
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[Sword Offer II 021. Remove the Nth Node From End of List](https://leetcode.cn/problems/SLwz0R/description/)

# Approach

**Two Pointers (Sliding Window Algorithm)**

In this approach, we first create a dummy head node `dummy` and point it to the original `head`. Then we use two pointers `fast` and `slow`, advancing `fast` by `n` steps first.

Next, we move both `fast` and `slow` simultaneously until `fast` reaches the end of the list. At this point, `slow` points to the `(n+1)`-th node from the end. We set `slow.next = slow.next.next` to delete the `n`-th node from the end.

Finally, we return `dummy.next`, which is the head of the updated list.

The initial implementation was inspired by C-style linked list approach.

# Code

```python Sliding window algorithm
class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        # Create a dummy head node
        dummy = ListNode(0)
        # Point dummy's next to the original head
        dummy.next = head
        # Define fast and slow pointers, advance fast by n steps
        fast = slow = dummy
        for i in range(n):
            fast = fast.next
        # Move both pointers simultaneously until fast reaches the tail
        while fast and fast.next:
            fast = fast.next
            slow = slow.next

        # Set slow's next to slow.next.next to delete the nth node from end
        slow.next = slow.next.next
        return dummy.next
```

```python Pure linked list
class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:

        # Calculate length
        def get_list_length(head):
            # If the linked list is empty, length is 0
            if not head:
                return 0

            # Traverse the linked list and count
            length = 0
            current = head
            while current:
                length += 1
                current = current.next

            return length

        # Find and delete the target node
        def delete(node, count):
            if count == n + 1 or n == length:
                node.next = node.next.next
                return
            if node.next:
                delete(node.next, count - 1)

        length = get_list_length(head)
        delete(head, length)
        return head


def list_to_linked_list(lst):
    if not lst:
        return None

    # Head node
    head = ListNode(lst[0])
    current = head

    # Traverse the list and convert each element to a linked list node
    for i in range(1, len(lst)):
        current.next = ListNode(lst[i])
        current = current.next

    return head
```
