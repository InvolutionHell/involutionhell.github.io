---
title: "146. LRU Cache"
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - Linked list
  - design
  - Hash table
  - Doubly linked list
abbrlink: b9130c0e
docId: u0szm4sv8mr3on3ivbfo5r84
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

First encountered: `2023/3/14-15:21`

[146. LRU Cache](https://leetcode-cn.com/problems/lru-cache/)

# Approach

Simple simulation using a dictionary — I didn't actually use the doubly linked list or LRU concepts. I feel guilty about this one; I can barely remember the air conditioner I built six months ago.

The answer should be understandable from the code comments. Feel free to ask if anything is unclear.

# Code

```python
class LRUCache:

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = collections.OrderedDict()

    def get(self, key: int) -> int:
        # if key is in the dictionary, return its value
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]

        else:
            # if key is not in the dictionary, return -1
            return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            # if key is in the dictionary, update its value
            self.cache.move_to_end(key)
            self.cache[key] = value
        else:
            if len(self.cache) == self.capacity:
                # if key is not in the dictionary and cache is full, evict LRU element
                self.cache.popitem(last=False)
            # if key is not in the dictionary and cache is not full, add the element
            self.cache[key] = value
```

# Second Solution

```python
class Node:
    # Speed up attribute access and save memory
    __slots__ = 'prev', 'next', 'key', 'value'

    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.dummy = Node()  # sentinel node
        self.dummy.prev = self.dummy
        self.dummy.next = self.dummy
        self.key_to_node = dict()

    def get_node(self, key: int) -> Optional[Node]:
        if key not in self.key_to_node:  # key not found
            return None
        node = self.key_to_node[key]  # key found
        self.remove(node)  # remove from current position
        self.push_front(node)  # move to front
        return node

    def get(self, key: int) -> int:
        node = self.get_node(key)
        return node.value if node else -1

    def put(self, key: int, value: int) -> None:
        node = self.get_node(key)
        if node:  # key exists
            node.value = value  # update value
            return
        self.key_to_node[key] = node = Node(key, value)  # new node
        self.push_front(node)  # move to front
        if len(self.key_to_node) > self.capacity:  # over capacity
            back_node = self.dummy.prev
            del self.key_to_node[back_node.key]
            self.remove(back_node)  # remove LRU node

    # Remove a node
    def remove(self, x: Node) -> None:
        x.prev.next = x.next
        x.next.prev = x.prev

    # Add a node at the front of the linked list
    def push_front(self, x: Node) -> None:
        x.prev = self.dummy
        x.next = self.dummy.next
        x.prev.next = x
        x.next.prev = x
```
