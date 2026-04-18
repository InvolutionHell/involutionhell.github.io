---
title: 手写定长内存池
description: ""
date: "2025-09-29"
tags:
  - tag-one
docId: xgxqqvglxyauoeh8eye7lzu6
---

# 手写定长内存池

## 设计图

![画板](https://cdn.nlark.com/yuque/0/2025/jpeg/43055607/1758718719250-e6f52459-0f73-493b-8294-7b8f931da054.jpeg)

## 代码部分

### 结构体定义

#### 管理内存池结构的结构体mempool_s

```c
typedef struct mempool_s {
    int blocksize;  // 每个内存块的size
    int freecount;   // 剩余空的内存块数量
    char *free_ptr;   // 指向下一空内存块
    char *mem;   // 整块内存的头指针
} mempool_t;
```

### 对外接口

#### memp_create: 内存池创建

```c
int memp_create(mempool_t *m, int block_size) {

    if (!m) return -1;

    // 1. 初始化这两个简单的int
    m->blocksize = block_size;
    m->freecount = MEM_PAGE_SIZE / block_size;

    // 2. 开整个内存池的空间，顺便初始化m->mem
    m->mem = (char *)malloc(MEM_PAGE_SIZE);
    if (!m->mem) {  // 开失败了（剩余空闲内存不够）
        return -2;
    }
    // 将这个空间初始化一下
    memset(m->mem, 0, MEM_PAGE_SIZE);

    // 3. 初始化free_ptr
    m->free_ptr = m->mem;

    // 依次初始化每个block里的"next->ptr"
    int i = 0;
    char *ptr = m->mem;
    for (i = 0;i < m->freecount;i ++) {

        *(char **)ptr = ptr + block_size;
        ptr = ptr + block_size;
    }
    // 最后一个block的"next_ptr"指向NULL
    *(char **)ptr = NULL;
    return 0;
}
```

#### memp_alloc: 分配block

```c
void *memp_alloc(mempool_t *m) {
    // 满了
    if (!m || m->freecount == 0) return NULL;
    // 1. 获取当前下一个空闲块，作为返回值
    void *ptr = m->free_ptr;
    // 2. 更新free_ptr
    m->free_ptr = *(char **)ptr;
    // 3. 更新freecount
    m->freecount --;

    return ptr;
}
```

#### memp_free: 删除指定block

```c
void memp_free(mempool_t *m, void *ptr) {
    // 相当于 ptr->next = m->free_ptr;
    // 头插法将要释放的block插到空闲block链表的头部，即空闲block链表又增加了一个
    *(char **)ptr = m->free_ptr;
    // 更新free_ptr这一空闲block链表头指针
    m->free_ptr = (char *)ptr;
    // 更新freecount
    m->freecount ++;
}
```

#### memp_destory: 删除整个内存池

```c
void memp_destory(mempool_t *m) {
    if (!m) return ;
    // 直接free内存池，因为内存池是整体malloc的，而不是一个一个block malloc的
    free(m->mem);
}
```

## 使用example

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

输出：可以看到每个block确实是32个字节

![](https://cdn.nlark.com/yuque/0/2025/png/43055607/1759069995143-4548da88-8c23-463e-b9e7-0f7d8978f03b.png)
