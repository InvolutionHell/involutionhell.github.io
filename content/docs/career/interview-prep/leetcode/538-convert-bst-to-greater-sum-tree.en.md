---
title: "538. Convert BST to Greater Sum Tree"
date: "2024.01.01 0:00"
tags:
  - - Python
  - - answer
  - - Binary tree
abbrlink: 32401b69
docId: wen0bbo8m93oih1mx6sva9sh
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Problem

[538. Convert BST to Greater Sum Tree](https://leetcode.cn/problems/convert-bst-to-greater-sum-tree/)

Given the root of a Binary Search Tree (BST) with distinct node values, convert it into a Greater Sum Tree such that every node's new value equals the sum of all values greater than or equal to the original value in the BST.

# Approach

**Method 1: Reverse In-order Traversal**

This problem requires us to update each node's value to the sum of all values greater than itself. We can traverse the BST in reverse in-order (right → node → left), accumulating the sum as we go and updating each node's value.

**Method 2: Morris Traversal**

There's an elegant online solution that uses only O(1) space for in-order traversal. It was first proposed by J. H. Morris in his 1979 paper "Traversing Binary Trees Simply and Cheaply," hence the name Morris Traversal.

Let's walk through an example with a simple binary tree:

```markdown
          1
         / \
        2   3
       / \
      4   5
```

1. Initialize the current node as the root (`current = 1`).

2. While the current node is not null:
   1. If the current node has a left child, find the in-order predecessor (rightmost node of the left subtree). In this example, the predecessor is node 5.
   2. If the predecessor's right node is null, point it to the current node (`5 -> 1`).
   3. Move the current node to its left child (`current = 2`).

   ...and so on, traversing via the threaded links until complete.

# Code

```python Reverse in-order traversal
class Solution:
    def convertBST(self, root: TreeNode) -> TreeNode:
        def dfs(root: TreeNode):
            nonlocal total
            if root:
                dfs(root.right)
                total += root.val
                root.val = total
                dfs(root.left)

        total = 0
        dfs(root)
        return root
```

```python Morris Traversal
class Solution:
    def convertBST(self, root: TreeNode) -> TreeNode:
        # Get the successor node (next node in in-order traversal)
        def getSuccessor(node: TreeNode) -> TreeNode:
            succ = node.right
            while succ.left and succ.left != node:
                succ = succ.left
            return succ

        total = 0  # accumulated sum
        node = root

        while node:
            if not node.right:  # right child is null
                total += node.val
                node.val = total
                node = node.left
            else:
                succ = getSuccessor(node)
                if not succ.left:  # successor's left is null
                    succ.left = node  # create thread
                    node = node.right
                else:  # successor's left is not null
                    succ.left = None  # remove thread
                    total += node.val
                    node.val = total
                    node = node.left

        return root

class Solution:
    def convertBST(self, root: TreeNode) -> TreeNode:
        def convert(node: TreeNode, total: int) -> int:
            if not node:
                return total

            # recursively traverse right subtree
            total = convert(node.right, total)

            # update node value to accumulated sum
            total += node.val
            node.val = total

            # recursively traverse left subtree
            total = convert(node.left, total)

            return total

        convert(root, 0)
        return root
```
