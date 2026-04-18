---
title: linux/win上的c++库
description: ""
date: "2025-09-29"
tags:
  - tag-one
docId: totx4pej5lhyt1nl4anwhakj
---

# linux/win上的c++库

## 一、一个库长什么样？

每个库源码的格式都不一样。但都会有：

1. .hpp/.h(位于include或根目录下) ：用来链接的头文件，不能没有
2. .cpp ：实现头文件的逻辑，有的源码被称为头文件库（直接在头文件里实现了逻辑，没有.cpp实现，也不需要链接动态库或静态库）。

- 在 Linux 上：`XXX.so`（shared object动态库） 或 `XXX.a`（static静态库）
- 在 Windows 上：`XXX.lib`（静态库） 或 `XXX.dll`（动态库）

## 二、如何得到一个库？

> 非特殊标明，都是linux环境（具体为Ubuntu）

### 下载别人写的库

#### win环境

    1. **手动从源码编译安装  ：**下载或git clone一个zip/7z等压缩包，解压后得到源代码，编译得到所需库。
    2. **使用对应语言的包管理工具**（c++: 如vcpkg，python: 如pip，java: 如maven）下载。如vcpkg会将包下载到vcpkg/installed/下（默认）。

> 简单介绍一下vcpkg
>
> - **vcpkg** 是微软开源的跨平台 C/C++ 包管理器。
> - 支持 **Windows / Linux / macOS**，但最早是为 Windows 生态开发的。
> - 主要用来解决：C/C++ 第三方库获取困难、编译配置复杂的问题。

#### linux环境

    1. **从源码编译安装  **

> 有些库只能源码安装，比如最新版本的 gRPC、Protobuf。
>
> 一般步骤是：clone -> make流程或者build.sh这种一键脚本。

    2. **使用系统自带的包管理器**

> apt, yum, dnf等

    3. **使用对应语言的包管理工具**

> vcpkg，conan等

### 自己写一个库

写完.cpp和.h后，可选择将其编译成静态库或动态库。

#### 打包为静态库

```bash
g++ -c mylib.cpp -o mylib.o
ar rcs my_static_lib.a mylib.o  // 不建议
// 事实上，打包时应在目标文件名前+lib。
// 这不只是约定俗成。
// 使用-lmylib时，链接器会自动加前缀去找，即找libmylib.a或.so。
// 如果不加lib前缀，只能写清完整路径了（不能依靠链接器自己去找了）
ar rcs libmy_static_lib.a mylib.o  // 建议
```

#### 打包为动态库

```bash
// 简单的项目，一步到位
g++ -shared -o mylib.dll mylib.cpp
// 复杂的项目，先转为中间文件.o，再将.o文件转为mylib.dll
g++ -c -fPIC mylib.cpp -o mylib.o
g++ -shared -o my_dynamic_lib.dll mylib.o
```

-fPIC表示生成位置独立代码（Position Independent Code），这是动态库所需要的。

如上，我们就得到my_dynamic_lib.dll动态库和my_static_lib.a静态库了。

## 三、下载的库被放在了哪里

#### python的库可能放在

- 项目根目录下的venv文件夹中（用venv创建的虚拟环境，也可以叫其他名，自己创建时命名）
- conda目录下的某环境文件夹中（下载conda时指定一个存放环境的文件路径，所有由conda创建的虚拟环境都放在这里，环境名作为二级目录名）

#### 前端的库可能放在

- 项目根目录下的node_modules中（有npm包管理创建和管理）

#### Java的Spring项目（Maven包管理）可能放在

- 缓存到 ~/.m2/repository/ （本地仓库，win和linux都是）

#### c++的库（linux环境）

- 系统自带库：`/lib`, `/lib64`, `/usr/lib`, `/usr/lib64`
- apt/yum/dnf/pacman 包管理器库：`/usr/lib/x86_64-linux-gnu`（库文件）, `/usr/include`（头文件）
- 自己编译：`/usr/local/lib`, `/usr/local/include`
- 包管理器（vcpkg/conan）：用户目录下的专用路径
  - vcpkg：`~/vcpkg/installed/<triplet>/lib`
  - conan：`~/.conan/data/<package>/<version>/...`
  - 自己放的：`~/lib`, `~/include`

## 四、如何使用一个库呢？

> 使用库两个步骤，一是**链接头文件**，二是**链接库实现**

### 链接 头文件

> 不用-I（大写i）的时候默认寻找当前文件目录

1. 不改变库头文件位置，硬编码指定所有库的头文件路径在哪（每个头文件各指定一次）

```bash
g++ -I path/to/s_lib1.h -I path/to/s_lib2.h ... -o output main.cpp
```

2. 整合头文件移到include目录下（注意如果是三方库，不建议移动，因为一般还有其他依赖项。自己的库，建议整合头文件），移到项目下的include目录下，然后指定头文件目录为include目录（只指定一次）

```bash
g++ -I include/ -o output main.cpp
```

（注意指定头文件目录 + #include “path/to/lib.h”共同拼接成头文件完整路径）

> 是否觉得纯命令行编译太麻烦太长，后面用CMake时写进CMakeList.txt里更方便

### 链接 库实现

> **对于非纯头文件库，还需要连接库实现，其分为动态库和静态库**

#### 链接动态库

```bash
g++ myapp.cpp -L /path/to/library -l mylib
```

在运行时建议将 .dll动态库 放在与 可执行文件 同级目录下。因为其查找顺序为：

1. win环境（优先级高到低）

- 程序当前目录（通常是 `exe` 文件所在的目录）。
- Windows 系统目录（例如 `C:\Windows\System32`）。
- 当前用户的 `AppData` 文件夹。

2. linux环境（优先级高到低）

- 运行时指定的 `LD_LIBRARY_PATH` 环境变量
- 可执行文件的 `rpath` / `runpath` 设置
- 系统配置文件 `/etc/ld.so.cache`
- ** 系统默认目录（最常用）** - `/lib` - `/usr/lib` - `/usr/local/lib` - `/lib64`（64 位系统）  
  这些是硬编码在动态链接器里的。

> 也可以1. 设置PATH环境变量。2. 在代码里使用LoadLibrary("D:\libs\mylib.dll"); 显示加载DLL

#### 链接静态库

```bash
g++ main.cpp -L /path/to/lib -l <lib_name>
```

注意：静态库在编译过程中，只会检查头文件的可用性，不会在编译阶段检查三方库是否存在或是否链接正确。这是因为静态库的编译阶段只生成目标文件（`.o` 文件）并打包成 `.a` 文件，而不会涉及链接阶段。因此，在一个c++程序实现时，可划分为以下三个阶段：

- **编译静态库时**：
  - 只需要包含头文件（`include_directories`），不需要指定三方库的 `.a` 或 `.so` 文件。
- **编译主程序时**：
  - 只需要包含静态库的头文件。
  - 不需要指定三方库的 `.a` 或 `.so` 文件。
- **主程序链接阶段**：
  - 必须显式引入静态库和它依赖的三方库文件（如 `lthirdparty`）。

**四. 常见编译参数解释**（命令行编译方式）：

1. -I(这是个大写i) + 库的头文件目录，告诉编译器去哪找头文件（必须）
2. -L + 指定库文件所在目录
3. -l(这是个小写L) + ，指定库名，搜索目标是.so或.a(Win的是.dll和.lib)（不需要写后缀，优先链接动态库）

-L和-l(小写L)的区别是前者指定库所在路径，后者指定该路径下具体库名
