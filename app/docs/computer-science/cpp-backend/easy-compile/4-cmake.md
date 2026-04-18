---
title: CMake
description: ""
date: "2025-09-29"
tags:
  - tag-one
docId: xk44lx4q1gpcm1uqk8nnbg7q
---

# CMake

[https://juejin.cn/post/6844903557183832078](https://juejin.cn/post/6844903557183832078) 掘金的一个cmake教程

[https://zhuanlan.zhihu.com/p/97369704](https://zhuanlan.zhihu.com/p/97369704) 知乎的一个cmake教程

CMake用来编译一个c++项目，将其编译为一个可执行文件或动态\静态lib库

## cmake相关指令

cmake —help查看更多信息

1. CMake需要一个CMakeList.txt或在执行CMake时将参数手动加入
2. 在构建时建议在项目目录下新建一个build目录，进入build目录中执行（后续用—build参数可指定构建目录）

```bash
cmake .. // + 需要额外添加的参数（未在CMakeList.txt中声明的，一般都在CMakeList.txt中声明了）
```

从命令可以看出，执行cmake的工作目录在build，是为了构建生成文件（包括构建过程中的中间文件和目标文件）不与项目目录文件混为一谈。而上一层指令（“..”）代表CMakeList.txt和源代码位于上一层即项目根目录中。

cmake分两步，第一步生成构建系统文件，第二部使用构建系统。对应关键指令：

1. 执行预设

```bash
cmake --preset=default
```

build.ninja

CMakeCache.txt

CMakeFiles

cmake_install.cmake

vcpkg_installed

vcpkg-manifest-install.log

除了执行预设文件，还有原始的手动版本：

声明-S配置源文件目录，-B配置build目录即可。比如

cmake -S . 代表设定当前目录为源目录（在cmake中有关键字**`CMAKE_SOURCE_DIR`**得到源目录）

1. 执行构建

```bash
cmake --build vcpkg-build   // 表示构建目标去vcpkg-build，这就不用进入build目录再cmake ..了
```

build.ninja

CMakeCache.txt

CMakeFiles

cmake_install.cmake

libfeature-extraction-lib.a （比上面第一步多的一个生成的静态库）

vcpkg_installed

vcpkg-manifest-install.log

## CMakeList.txt

### find_package方法深入理解

find_package(某个库名 可选参数：CONFIG REQUIRED)

find_package**不会提前查找所有 Boost 组件**，而是延迟到 `target_link_libraries` 或其他需要时才加载相应的组件。只是指定一个全局目标。

CONFIG

REQUIRED

find_package源代码

find_package寻找路径

### .cmake文件

CMakeList.txt和.cmake文件的语法是一模一样的。准确来说，.cmake文件就像CMakeList.txt一个封装好的结构。使用以下方法引入：

```makefile
include(cmakes/gtests_main.cmake)
include(cmakes/gtests_fe.cmake)
```

一般结合条件语句，比如是否开启单元测试：

```makefile
option(BUILD_TESTS "Build tests" OFF)
if (BUILD_TESTS)
    include(cmakes/gtests_main.cmake)
    include(cmakes/gtests_fe.cmake)
endif ()
```

1. 每个cmake语法中的执行参数都与g++参数对应，除非是内部使用的（类似于内部形参，方便编写用的）

CMakeList.txt中几个必需的执行参数/配置项，及其对应的g++参数

1. 定义生成的目标是exe还是lib add_executable(my_program main.cpp) 或 add_library(my_library STATIC my_library.cpp)

前者对应

```bash
g++ -o my_program main.cpp
```

后者对应

```bash
g++ -c my_library.cpp -o my_library.o
ar rcs libmy_library.a my_library.o
```

1. 链接依赖库 target_link_libraries(my_program gtest gtest_main)
2. 依赖的外部头文件和库的头文件include_directories(my_program PRIVATE /path/to/include) 或 target_include_directories(my_program PRIVATE /path/to/include)
3. 设置构建类型 CMAKE_BUILD_TYPE

内部使用，cmake专属：

1. 指定CMake最低版本 cmake_minimum_required(VERSION 3.10)
2. 设置项目名称和版本 project(项目名称 VERSION 1.0 LANGUAGES CXX)
3. 找包 find_package(包名:与文件名同名 CONFIG REQUIRED)

找包路径顺序（来自chatGPT，期待后续改正）：

**默认查找路径**`CMake` 会按照以下顺序查找 `spdlog` 的配置文件：

- 在环境变量 `CMAKE_PREFIX_PATH` 指定的路径下查找。
- 在系统默认的安装路径（如 `/usr/lib/cmake`、`/usr/local/lib/cmake`）中查找。
- 在 `CMAKE_INSTALL_PREFIX` 指定的路径下查找。
- 如果项目使用包管理工具（如 `vcpkg`），在工具链文件指定的路径下查找。

（默认是[vcpkg-root]/installed/[triplet]/**share/**[package]/[package]Config.cmake）

引申一下：

包的头文件会安装到：[vcpkg-root]/installed/[triplet]/include/

库文件会安装到：[vcpkg-root]/installed/[triplet]/lib/

1. 如果不使用CMakeList.txt, 命令行中所必需的参数\配置
   1. 指定源代码路径（必须）
   2. 指定构建类型-D CMAKE_BUILD_TYPE=Release或Debug
   3. 选择构建生成器
      1. -G "Unix Makefiles” // unix的一个make生成器
      2. -G “MinGW Makefiles” // win的一个make生成器
      3. -G “Ninja” // Ninja生成器，需要额外安装
      4. -G "Visual Studio 16 2019” // Visual Studio 生成器2019版本
      5. -G "Xcode” // 苹果的Xcode
