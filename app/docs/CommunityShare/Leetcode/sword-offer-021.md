---
title: Sword finger Offer II 021. Delete the countdown of the linked list n Node.md
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
abbrlink: 3ed2f01c
docId: qfvqmc1exp066falnsg97c5m
---

# topic：

[Sword finger Offer II 021. Delete the countdown of the linked list n Node.md](https://leetcode.cn/problems/SLwz0R/description/)

# Thought：

Double pointer（Sliding window algorithm）。
In this method，We first created a virtual head node dummy，And point it to the original head point head。
Then we use two pointers fast and slow，Will fast Poor movement move forward n step。
Next，We move at the same time fast and slow pointer，until fast pointer到达链表的末尾。
at this time，slow pointer指向倒数第 n+1 Node，我们Will其 next pointer指向 slow.next.next，So as to delete the countdown n Node。

at last，We return virtual head nodes next pointer，It points to delete the countdown n Node后的链表的Head node。

At the beginning, according toCLinked

# Code：

```python Sliding window algorithm
class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:
        # Create a virtual head node
        dummy = ListNode(0)
        # Will虚拟Head node的 next Pointing to the original head point
        dummy.next = head
        # 定义快慢pointer，并Will快Poor movement move forward n step
        fast = slow = dummy
        for i in range(n):
            fast = fast.next
        # 同时移动快慢pointer，until快pointer到达链表末尾
        while fast and fast.next:
            fast = fast.next
            slow = slow.next

        # Will慢pointer的 next pointer指向慢pointer的下一Node的下一Node，So as to delete the countdown n Node
        slow.next = slow.next.next
        return dummy.next
```

```python Pure linked list
class Solution:
    def removeNthFromEnd(self, head: Optional[ListNode], n: int) -> Optional[ListNode]:

        # Calculation length
        def get_list_length(head):
            # If the linked list is empty，Length0
            if not head:
                return 0

            # Links in traversal，Count
            length = 0
            current = head
            while current:
                length += 1
                current = current.next

            return length

        # Find the deleted node
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

    # Elements in the list of traversal，Will其转换为链表节点
    for i in range(1, len(lst)):
        current.next = ListNode(lst[i])
        current = current.next

    return head
```
