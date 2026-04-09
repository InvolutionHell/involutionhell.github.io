---
title: 146.LRU cache
date: "2024.01.01 0:00"
tags:
  - Python
  - answer
  - Linked
  - design
  - Hash table
  - 双向Linked
abbrlink: b9130c0e
docId: u0szm4sv8mr3on3ivbfo5r84
---

# topic：

I met for the first time：'2023/3/14-15:21'

[146.LRU cache.md](https://leetcode-cn.com/problems/lru-cache/)

# Thought：

Simple simulation，Use the dictionary to make it，好像完全没用到双向Linked和LRU的Thought。。。I'm guilty，I can remember the air conditioner made in half a year ago。
answer就看Code的注释应该就能看懂，I will reply if I don’t understand。

# Code：

```python
class LRUCache:

    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = collections.OrderedDict()

    def get(self, key: int) -> int:
        # ifkeyIn the dictionary，returnvalue
        if key in self.cache:
            self.cache.move_to_end(key)
            return self.cache[key]

        else:
            # ifkey不In the dictionary，return-1
            return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            # ifkeyIn the dictionary，renewvalue
            self.cache.move_to_end(key)
            self.cache[key] = value
        else:
            if len(self.cache) == self.capacity:
                # ifkey不In the dictionary，The dictionary is full，Delete the least recently used elements
                self.cache.popitem(last=False)
            # ifkey不In the dictionary，Dictionary is not full，Add element
            # self.cache.move_to_end(key)
            self.cache[key] = value
```

# Second solution

```python
class Node:
    # Improve the speed of access attributes，And save memory
    __slots__ = 'prev', 'next', 'key', 'value'

    def __init__(self, key=0, value=0):
        self.key = key
        self.value = value

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.dummy = Node()  # Sentry node
        self.dummy.prev = self.dummy
        self.dummy.next = self.dummy
        self.key_to_node = dict()

    def get_node(self, key: int) -> Optional[Node]:
        if key not in self.key_to_node:  # No this book
            return None
        node = self.key_to_node[key]  # Have this book
        self.remove(node)  # Draw this book
        self.push_front(node)  # Put on the top
        return node

    def get(self, key: int) -> int:
        node = self.get_node(key)
        return node.value if node else -1

    def put(self, key: int, value: int) -> None:
        node = self.get_node(key)
        if node:  # Have this book
            node.value = value  # renew value
            return
        self.key_to_node[key] = node = Node(key, value)  # new book
        self.push_front(node)  # Put on the top
        if len(self.key_to_node) > self.capacity:  # There are too many books
            back_node = self.dummy.prev
            del self.key_to_node[back_node.key]
            self.remove(back_node)  # Remove the last book

    # Delete a node（Draw a book）
    def remove(self, x: Node) -> None:
        x.prev.next = x.next
        x.next.prev = x.prev

    # 在Linked头添加一个节点（把一本书Put on the top）
    def push_front(self, x: Node) -> None:
        x.prev = self.dummy
        x.next = self.dummy.next
        x.prev.next = x
        x.next.prev = x
```
