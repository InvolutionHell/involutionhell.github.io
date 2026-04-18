---
title: 手写线程池
description: ""
date: "2025-09-29"
tags:
  - tag-one
docId: mnjkrtrs7xk3fq538eqreuge
---

# 线程池

> 以下是调用单队列BlockingQueue的代码，使用双队列时将所有BlockingQueue改为BlockingQueuePro

## 接口

构造：用智能指针 unique_ptr 初始化阻塞队列，创建threads_num个线程并给每个绑定Worker函数开始执行task。（此时全部Worker阻塞在Pop()里）

Post: 发布任务到线程池。

析构：通知唤醒所有消费者，没有任务就自己下班。与生产者没关系。

```cpp
#pragma once

#include <thread>
#include <functional>
#include <vector>

template <typename T>
class BlockingQueue;

class ThreadPool {
public:
    // 初始化线程池
    explicit ThreadPool(int threads_num);

    // 停止线程池
    ~ThreadPool();

    // 发布任务到线程池
    void Post(std::function<void()> task);

private:
    // 每个线程运行的循环函数
    void Worker();
    // 任务队列
    std::unique_ptr<BlockingQueue<std::function<void()>>> task_queue_;
    // 存放所有的线程对象。每个线程都会绑定 Worker() 执行函数
    std::vector<std::thread> workers_;
};
```

```cpp
#include "blockingqueue.h"
#include <memory>
#include "threadpool.h"

// 创建一个阻塞队列，开threads_num个线程，每个线程绑定执行 Worker() 方法。
ThreadPool::ThreadPool(int threads_num) {
    task_queue_ = std::make_unique<BlockingQueue<std::function<void()>>>();
    for (size_t i = 0; i < threads_num; ++i) {
        workers_.emplace_back([this] {Worker();});
// 使用 lambda 捕获 this [this] { Worker(); }，所以每个线程都能调用当前对象的 Worker 函数。
    }
}

// 停止线程池
// 取消队列并唤醒所有阻塞线程
ThreadPool::~ThreadPool() {
    task_queue_->Cancel();
    for(auto &worker : workers_) {
        if (worker.joinable())
            worker.join();
    }
}

// 发布任务
void ThreadPool::Post(std::function<void()> task) {
    task_queue_->Push(task);
}

// 从task_queue_中取出任务
void ThreadPool::Worker() {
    while (true) {
        std::function<void()> task;
        // 阻塞在Pop里实现
        if (!task_queue_->Pop(task)) {
            break;
        }
        task();
    }
}
```

# 阻塞队列（单队列版）

![画板](https://cdn.nlark.com/yuque/0/2025/jpeg/43055607/1758722093302-3845f815-ddbc-4bee-a789-de63daa92cd1.jpeg)

**单队列维护：**

1. nonblock\_(bool): 未阻塞标记。为true时，队列不会阻塞。初始（构造时）默认为阻塞状态。
2. queue\_(std::queue<T>): 底层存储容器。
3. mutex\_(std::mutex): 保证多线程操作安全的互斥锁。
4. not*empty*（std::condition_variable）：用于线程前同步。

```cpp
template <typename T>
class BlockingQueue {
public:
    BlockingQueue(bool nonblock = false) : nonblock_(nonblock) { }
    // 入队操作
    void Push(const T &value) {
        // lock_guard自动加锁解锁，与声明周期一致（实现了构造加锁和析构解锁）
        std::lock_guard<std::mutex> lock(mutex_);
        // 元素入队
        queue_.push(value);
        // 通知一个正在 wait 的线程: 队列不空，可以取任务。
        not_empty_.notify_one();
    }
    // 正常 pop  弹出元素
    // 异常 pop  没有弹出元素
    bool Pop(T &value) {
        // 加锁
        // 如果该线程已被加锁则进不来
        // condition_variable::wait需要这个unique_lock
        std::unique_lock<std::mutex> lock(mutex_);

        // 这一行的主要作用是 维护取操作的安全性(在队列非空的时候才能继续往下走。
        //	   但是如果只判断队列是否为空来决定是否往下走，Cancel之后怎么办？
        //     即我想清空队列后结束所有线程，此时消费者线程依旧会被阻塞在这一行，因为它不知道是否要结束。
        //     所以我们设置标志nonblock_来告诉消费者线程是否结束)
        // 当 队列非空 或者 队列执行了Cancel 时 -> predicate谓词为true->正常往下走
        //     即队列里还有任务，或者队列里没任务了，但是消费者知道任务结束了，可以继续下班了。都会继续往下走。
        // 当 队列为空 并且 队列未执行Cancel 时 -> 谓词为false -> 此线程自动解锁mutex，让出CPU，阻塞在这一行
        //     即队列空了，并且消费者知道还没下班，则阻塞等待。
        not_empty_.wait(lock, [this]{ return !queue_.empty() || nonblock_; });
        if (queue_.empty()) return false;  // 该消费者线程下班

        value = queue_.front();
        queue_.pop();
        return true;
    }

    // 解除阻塞在当前队列的线程
    void Cancel() {
        // 自动加锁解锁
        std::lock_guard<std::mutex> lock(mutex_);
        // 告诉消费者下班
        nonblock_ = true;
        // 主动唤醒所有阻塞在wait的消费者（在wait的消费者被唤醒后还会走一遍wait的谓词判断。false则继续阻塞）
        not_empty_.notify_all();
    }

private:
    bool nonblock_;
    std::queue<T> queue_;
    std::mutex mutex_;
    std::condition_variable not_empty_;
};
```

# 阻塞队列（双队列版）

![画板](https://cdn.nlark.com/yuque/0/2025/jpeg/43055607/1759131100901-946e59ae-cd19-4546-aa9d-a9ee658f0b5a.jpeg)

单队列中， 生产者和消费者都要竞争同一把锁。

双队列：

- `prod_queue_`：生产者写入队列（保护锁 `prod_mutex_`）。
- `cons_queue_`：消费者读取队列（保护锁 `cons_mutex_`）。
- 当消费者队列空时，通过 `SwapQueue_()` 将生产队列和消费队列 **交换**，实现“批量搬运”。

好处是：

- **减少锁竞争**：生产者和消费者基本不抢同一把锁。
- **吞吐更高**：一次交换，消费者能批量取走数据，减少频繁加锁。

```cpp
template <typename T>
class BlockingQueuePro {
public:
    BlockingQueuePro(bool nonblock = false) : nonblock_(nonblock) {}

    void Push(const T &value) {
        std::lock_guard<std::mutex> lock(prod_mutex_);
        prod_queue_.push(value);
        not_empty_.notify_one();
    }

    bool Pop(T &value) {
        std::unique_lock<std::mutex> lock(cons_mutex_);
        // 消费者队列为空时自动触发swap，如果swap后仍为空，则消费失败
        // 此时就不需要.wait了
        if (cons_queue_.empty() && SwapQueue_() == 0) {
            return false;
        }
        value = cons_queue_.front();
        cons_queue_.pop();
        return true;
    }

    void Cancel() {
        std::lock_guard<std::mutex> lock(prod_mutex_);
        nonblock_ = true;
        not_empty_.notify_all();
    }

private:
    int SwapQueue_() {
        std::unique_lock<std::mutex> lock(prod_mutex_);
        // 当生产者队列为空，并且未告知下班时 -> 两个false -> 阻塞
        // 当Cancel了，不管队列是否为空，都会往下走
        not_empty_.wait(lock, [this] {return !prod_queue_.empty() || nonblock_; });
        std::swap(prod_queue_, cons_queue_);
        // 返回交换后消费者队列中的任务数量
        // =0只有一种情况，生产者队列为空时被告知下班
        return cons_queue_.size();
    }

    bool nonblock_;
    std::queue<T> prod_queue_;
    std::queue<T> cons_queue_;
    std::mutex prod_mutex_;
    std::mutex cons_mutex_;
    std::condition_variable not_empty_;
};
```

# Test

理论上双队列比单队列快，因为锁的竞争/碰撞少了。下面的实验结果也是如此：

写一个实验：设置4个生产者线程，一个生产者给25000个任务，任务是1000次循环。消费者数量指定当前cpu最适合线程数（std::thread::hardware_concurrency()）。我这个WSL环境是16个。

分别跑single(单队列)和double(双队列)，输出总耗时和QPS。

```cpp
std::atomic<int> task_counter{0};
int main() {
    const int num_producers = 4;
    const int num_tasks_per_producer = 25000; // 总共 100,000 个任务
    const int num_threads_in_pool = std::thread::hardware_concurrency();

    // 为了测试，single版本和double版本改为了继承自ThreadPoolBase的两个派生类
    // 想看具体实现可见附录
    ThreadPoolSingle pool(num_threads_in_pool);

    auto start = std::chrono::high_resolution_clock::now();

    std::vector<std::thread> producers;
    // 4个生产者开始干活
    for (int i = 0; i < num_producers; ++i) {
        producers.emplace_back(Producer, std::ref(pool), i, num_tasks_per_producer);
    }
    for (auto& p : producers) {
        p.join();
    }

    // 这里主线程忙等，用std::condition_variable，等待唤醒可能更高效
    while (task_counter < num_producers * num_tasks_per_producer) {
        std::this_thread::sleep_for(std::chrono::milliseconds(50));
    }

    auto end = std::chrono::high_resolution_clock::now();
    double elapsed = std::chrono::duration<double>(end - start).count();

    int total_tasks = num_producers * num_tasks_per_producer;
    std::cout << "[Single Queue] Total: " << total_tasks
              << " tasks. Time: " << elapsed
              << " seconds. QPS = " << total_tasks / elapsed << std::endl;
}
```

```cpp
void Task(int id) {
    volatile long sum = 0;
    for (int i = 0; i < 1000; ++i) {
        sum += i;
    }
    task_counter++;
}

void Producer(ThreadPoolSingle& pool, int producer_id, int num_tasks) {
    for (int i = 0; i < num_tasks; ++i) {
        int task_id = producer_id * 100000 + i;
        pool.Post([task_id]() { Task(task_id); });
    }
}
```

结果：  
![](https://cdn.nlark.com/yuque/0/2025/png/43055607/1758958199070-807c1517-f594-4617-bf88-3f8228a66594.png)

将任务数和主线程轮询时间各减一个0后（任务数改为2500，主线程轮询等待5）（因为完成的太快了，主线程等待时间过长影响结果）

![](https://cdn.nlark.com/yuque/0/2025/png/43055607/1758958396516-f9017fa6-3732-4c52-b585-ed44e7c8b3ef.png)

用平均数更准，但是这么大差距也不会被误差所影响。

# 附录

修改版单队列和双队列

```cpp
#pragma once

#include <thread>
#include <functional>
#include <vector>
#include "blockingqueue.h"
#include "blockingqueuepro.h"

// 前置声明
// blockingqueue 仅仅只能用作指针或引用

// template <typename T>
// class BlockingQueue;
// template <typename T>
// class BlockingQueuePro;

// class ThreadPool {
// public:
//     // 初始化线程池
//     explicit ThreadPool(int threads_num);

//     // 停止线程池
//     ~ThreadPool();

//     // 发布任务到线程池
//     void Post(std::function<void()> task);

// private:
//     void Worker();
//     std::unique_ptr<BlockingQueue<std::function<void()>>> task_queue_;
//     std::vector<std::thread> workers_;
// };


class ThreadPoolBase {
public:
    explicit ThreadPoolBase(int threads_num) : threads_num_(threads_num) {}
    virtual ~ThreadPoolBase() = default;

    virtual void Post(std::function<void()> task) = 0;

protected:
    int threads_num_;
    std::vector<std::thread> workers_;
};

class ThreadPoolSingle : public ThreadPoolBase {
public:
    explicit ThreadPoolSingle(int threads_num)
        : ThreadPoolBase(threads_num),
          task_queue_(std::make_unique<BlockingQueue<std::function<void()>>>()) {
        for (int i = 0; i < threads_num_; ++i) {
            workers_.emplace_back([this] { Worker(); });
        }
    }

    ~ThreadPoolSingle() {
        task_queue_->Cancel();
        for (auto &w : workers_) {
            if (w.joinable()) w.join();
        }
    }

    void Post(std::function<void()> task) override {
        task_queue_->Push(task);
    }

private:
    void Worker() {
        while (true) {
            std::function<void()> task;
            if (!task_queue_->Pop(task)) break;
            task();
        }
    }

    std::unique_ptr<BlockingQueue<std::function<void()>>> task_queue_;
};

class ThreadPoolDouble : public ThreadPoolBase {
public:
    explicit ThreadPoolDouble(int threads_num)
        : ThreadPoolBase(threads_num),
          task_queue_(std::make_unique<BlockingQueuePro<std::function<void()>>>()) {
        for (int i = 0; i < threads_num_; ++i) {
            workers_.emplace_back([this] { Worker(); });
        }
    }

    ~ThreadPoolDouble() {
        task_queue_->Cancel();
        for (auto &w : workers_) {
            if (w.joinable()) w.join();
        }
    }

    void Post(std::function<void()> task) override {
        task_queue_->Push(task);
    }

private:
    void Worker() {
        while (true) {
            std::function<void()> task;
            if (!task_queue_->Pop(task)) break;
            task();
        }
    }

    std::unique_ptr<BlockingQueuePro<std::function<void()>>> task_queue_;
};
```
