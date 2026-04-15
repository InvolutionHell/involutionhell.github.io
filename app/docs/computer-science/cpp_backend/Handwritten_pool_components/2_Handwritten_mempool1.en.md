---
title: Handwritten Fixed-Size Memory Pool
description: ""
date: "2025-09-29"
tags:
  - tag-one
docId: xgxqqvglxyauoeh8eye7lzu6
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T08:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Handwritten Fixed-Size Memory Pool

## Design Diagram

![Design](https://cdn.nlark.com/yuque/0/2025/jpeg/43055607/1758718719250-e6f52459-0f73-493b-8294-7b8f931da054.jpeg)

## Code

### Struct Definitions

#### `mempool_s` — struct that manages the memory pool

```c
typedef struct mempool_s {
    int blocksize;  // size of each memory block
    int freecount;   // number of remaining free blocks
    char *free_ptr;   // pointer to the next free block
    char *mem;   // head pointer of the entire memory pool
} mempool_t;
```

### Public Interface

#### `memp_create`: Create the memory pool

```c
int memp_create(mempool_t *m, int block_size) {

    if (!m) return -1;

    // 1. initialize these two simple ints
    m->blocksize = block_size;
    m->freecount = MEM_PAGE_SIZE / block_size;

    // 2. allocate space for the entire pool and initialize m->mem
    m->mem = (char *)malloc(MEM_PAGE_SIZE);
    if (!m->mem) {  // allocation failed (not enough free memory)
        return -2;
    }
    // zero-initialize the allocated space
    memset(m->mem, 0, MEM_PAGE_SIZE);

    // 3. initialize free_ptr
    m->free_ptr = m->mem;

    // initialize the "next pointer" inside each block
    int i = 0;
    char *ptr = m->mem;
    for (i = 0;i < m->freecount;i ++) {

        *(char **)ptr = ptr + block_size;
        ptr = ptr + block_size;
    }
    // the last block's "next_ptr" points to NULL
    *(char **)ptr = NULL;
    return 0;
}
```

#### `memp_alloc`: Allocate a block

```c
void *memp_alloc(mempool_t *m) {
    // pool is full
    if (!m || m->freecount == 0) return NULL;
    // 1. get the next free block as the return value
    void *ptr = m->free_ptr;
    // 2. update free_ptr
    m->free_ptr = *(char **)ptr;
    // 3. update freecount
    m->freecount --;

    return ptr;
}
```

#### `memp_free`: Free a specific block

```c
void memp_free(mempool_t *m, void *ptr) {
    // equivalent to: ptr->next = m->free_ptr
    // insert the freed block at the head of the free list (head insertion)
    *(char **)ptr = m->free_ptr;
    // update free_ptr (the head of the free block linked list)
    m->free_ptr = (char *)ptr;
    // update freecount
    m->freecount ++;
}
```

#### `memp_destory`: Destroy the entire memory pool

```c
void memp_destory(mempool_t *m) {
    if (!m) return ;
    // free the entire pool in one call — the pool was malloc'd as a whole, not block by block
    free(m->mem);
}
```

## Usage Example

```c
int main() {
    mempool_t m;
    memp_create(&m, 32);

    void *p1 = memp_alloc(&m);
    printf("memp_alloc : %p\n", p1);

    void *p2 = memp_alloc(&m);
    printf("memp_alloc : %p\n", p2);

    void *p3 = memp_alloc(&m);
    printf("memp_alloc : %p\n", p3);

    memp_free(&m, p2);
}
```

Output: each block is exactly 32 bytes apart, as expected.

![](https://cdn.nlark.com/yuque/0/2025/png/43055607/1759069995143-4548da88-8c23-463e-b9e7-0f7d8978f03b.png)
