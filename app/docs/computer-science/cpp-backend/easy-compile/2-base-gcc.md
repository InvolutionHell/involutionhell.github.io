---
title: 基础gcc/g++
description: ""
date: "2025-09-29"
tags:
  - tag-one
docId: kyu85av71b4n07hbdycbhvj9
---

# 基础gcc/g++

## g++启蒙

### 下载gcc/g++（Linux平台）

利用主流发行版的包管理器安装。

```cpp
sudo apt update
sudo apt install build-essential -y
// 检查版本
gcc --version
g++ --version
```

```cpp
// CentOS / RHEL 7:
sudo yum groupinstall "Development Tools" -y
// CentOS Stream 8 / RHEL 8+ / Fedora:
sudo dnf groupinstall "Development Tools" -y
```

### 下载gcc/g++（windows平台）

下载（以下是几个网址）并写入环境变量（以便在任何工作目录下都可以使用gcc/g++命令（.exe可执行文件））

1. minGW

[https://osdn.net/projects/mingw/downloads/68260/mingw-get-setup.exe/](https://www.mingw-w64.org/downloads/)

[https://www.mingw-w64.org/downloads/](https://www.mingw-w64.org/downloads/) （推荐）

**MinGW关于thread内置库踩了个坑：**

纯MinGW 9.2.0版本使用thread时需要这几步：

1. 需要去这个仓库下载（补充）几个头文件[https://github.com/meganz/mingw-std-threads](https://github.com/meganz/mingw-std-threads)

![](https://cdn.nlark.com/yuque/0/2025/png/43055607/1759049314232-221dc93b-c560-4036-b049-db786935066f.png)

将这几个头文件放入MinGW的include下。

1. 代码中引入头文件将include 改为include &lt;mingw.thread.h&gt; （这个点在上述仓库中的ReadMe里有写）
2. 如果是命令行编译，加上-D_WIN32_WINNT=0x0501这个参数，让编译器知道你正在针对 **Windows XP**（或更高版本）进行编译。（不知道是不是我的版本是win32的原因，也许mingw-win64版本不需要）

这是我踩坑的版本

![](https://cdn.nlark.com/yuque/0/2025/png/43055607/1759049360158-4e44b580-0b41-4c64-8266-3a2bf893aa12.png)

这是换成w64devkit

![](https://cdn.nlark.com/yuque/0/2025/png/43055607/1759049365783-54107cad-7f77-497a-a679-1cc80f2c5095.png)

而且纯MinGW在使用MinGW Installer（mingw-get.exe）时还要下载mingw32-make

### g++ 基本使用example

创建一个文本文件（test.txt），改后缀为cpp（表明是一个cpp源文件），用记事本/VS code（等文本编辑器）打开，写入：

```cpp
int main(){
    return 0;
}
```

保存关闭后。

在当前工作目录下（包含test.cpp的目录下）打开命令行（cmd），输入：

```bash
g++ test.cpp
```

在当前工作目录下出现a.exe可执行文件（execute是执行的意思）。这是因为没有指定输出文件的名称，编译器默认命名输出的.exe文件为a

下面在输出时命名输出文件（-o）

```bash
g++ -o b test.cpp
```

执行后在当前工作目录下出现b.exe可执行文件。

-o参数表达output，后面跟着输出文件名。（上述命令中我写了输出文件名为b）

可以更换参数与cpp文件的位置，如下（也可以随意更换参数与参数之间的位置）

```bash
g++ test.cpp -o b
```

（但注意参数（-o）和后面的参数值（b）是一体的，不要拆开。）

众所周知，c++/c的编译分为了四个阶段：(上述展示了“一步到位”的命令)

预处理（Preprocessing）→ 编译（Compilation）→ 汇编（Assembly）→ 链接（Linking）

| 阶段   | 输入文件 | 输出文件及扩展名                     | 命令参数（缩写含义） |
| ------ | -------- | ------------------------------------ | -------------------- |
| 预处理 | .cpp/.h  | 预处理文件.i (Intermediate或Include) | -E (Expansion)       |
| 编译   | .i       | 汇编代码.s                           | -S (Source)          |
| 汇编   | .s       | 目标文件.o                           | -c (Compile)         |
| 链接   | .o       | 可执行文件.exe或无扩展               | 单g++                |

_**预处理阶段： .cpp → .i**_  
处理头文件包含（`#include`）、宏展开（`#define`）、条件编译（`#ifdef` 等）等指令

```bash
g++ -E test.cpp  // 预处理后的代码（包含展开的宏和包含的头文件内容）直接显示在终端。
g++ -E test.cpp -o preprocess.i  // 生成b.i输出文件
```

_**编译阶段： .i → .s**_

预处理后的代码 → 汇编代码

```bash
g++ -S preprocess.i -o assemble.s
```

_**汇编阶段： .s → .o**_

将汇编代码 → 机器代码，生成目标文件（通常不可直接执行）。

```bash
g++ -c assemble.s -o machine.o
g++ -c test.cpp // 也可以直接放入.cpp生成同名.o机器代码
```

_**链接阶段： .o → .exe**_

将一个或多个目标文件与库文件链接 → 可执行文件。

```bash
g++ machine.o -o test
```

_**生成调试信息：**_

```bash
g++ -g test.cpp -o test  // 比直接g++ test.cpp -o test 多生成调试信息
```
