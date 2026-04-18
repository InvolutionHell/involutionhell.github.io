---
title: C++ Libraries on Linux/Windows
description: ""
date: "2025-09-29"
tags:
  - cpp-backend
  - cpp-libraries
  - development-environment
docId: totx4pej5lhyt1nl4anwhakj
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T08:00:00Z
translatorAgent: claude-sonnet-4-6
---

# C++ Libraries on Linux/Windows

## 1. What Does a Library Look Like?

Every library has its own source format, but all libraries share:

1. `.hpp`/`.h` (located under `include/` or the root directory): header files required for linking — these are mandatory.
2. `.cpp`: implements the logic declared in the headers. Some libraries are called **header-only libraries** (logic implemented directly in headers — no `.cpp`, no need to link a static or shared library).

- On Linux: `XXX.so` (shared object / dynamic library) or `XXX.a` (static library)
- On Windows: `XXX.lib` (static library) or `XXX.dll` (dynamic library)

## 2. How to Obtain a Library?

> Unless otherwise noted, the environment is Linux (specifically Ubuntu).

### Downloading a Third-Party Library

#### Windows

1. **Manually compile and install from source**: download or `git clone` a zip/7z archive, extract the source, and compile to produce the required library.
2. **Use a language-specific package manager** (C++: vcpkg; Python: pip; Java: Maven). For example, vcpkg downloads packages to `vcpkg/installed/` by default.

> A brief introduction to vcpkg:
>
> - **vcpkg** is Microsoft's open-source cross-platform C/C++ package manager.
> - Supports **Windows / Linux / macOS**, though it was originally developed for the Windows ecosystem.
> - Its main purpose is to simplify obtaining third-party C/C++ libraries and their complex build configurations.

#### Linux

1. **Compile and install from source**

> Some libraries can only be installed from source, such as the latest versions of gRPC and Protobuf.
>
> The typical workflow is: clone → run `make` or a one-click script like `build.sh`.

2. **Use the system package manager**

> `apt`, `yum`, `dnf`, etc.

3. **Use a language-specific package manager**

> vcpkg, conan, etc.

### Writing Your Own Library

After writing your `.cpp` and `.h` files, you can compile them into a static or dynamic library.

#### Package as a Static Library

```bash
g++ -c mylib.cpp -o mylib.o
ar rcs my_static_lib.a mylib.o  // not recommended
// In practice, prefix the output name with "lib".
// This is more than a convention.
// When using -lmylib, the linker automatically prepends "lib" when searching,
// looking for libmylib.a or .so.
// Without the "lib" prefix, you must specify the full path (the linker can't find it automatically).
ar rcs libmy_static_lib.a mylib.o  // recommended
```

#### Package as a Dynamic Library

```bash
// Simple project: one-step compilation
g++ -shared -o mylib.dll mylib.cpp
// Complex project: first compile to .o, then convert to .dll
g++ -c -fPIC mylib.cpp -o mylib.o
g++ -shared -o my_dynamic_lib.dll mylib.o
```

`-fPIC` generates Position Independent Code, which is required for dynamic libraries.

Following the steps above, you get `my_dynamic_lib.dll` (dynamic library) and `my_static_lib.a` (static library).

## 3. Where Are Downloaded Libraries Stored?

#### Python libraries may be located at

- `venv/` in the project root (a virtual environment created by `venv`; the folder name is user-defined)
- A specific environment folder under the conda directory (the conda base path is set when conda is installed; all conda environments are stored there, with the environment name as a subdirectory)

#### Frontend libraries may be located at

- `node_modules/` in the project root (created and managed by npm)

#### Java Spring projects (Maven) may be located at

- Cached at `~/.m2/repository/` (the local Maven repository, same on Windows and Linux)

#### C++ libraries (Linux)

- System built-in libraries: `/lib`, `/lib64`, `/usr/lib`, `/usr/lib64`
- apt/yum/dnf/pacman package manager libraries: `/usr/lib/x86_64-linux-gnu` (library files), `/usr/include` (headers)
- Self-compiled: `/usr/local/lib`, `/usr/local/include`
- Package managers (vcpkg/conan): dedicated paths under the user's home directory
  - vcpkg: `~/vcpkg/installed/<triplet>/lib`
  - conan: `~/.conan/data/<package>/<version>/...`
  - Custom placement: `~/lib`, `~/include`

## 4. How to Use a Library?

> Using a library requires two steps: **link the headers** and **link the library implementation**.

### Link Headers

> Without `-I` (uppercase i), the compiler searches the current file's directory by default.

1. Keep library headers in place and hard-code each header path individually:

```bash
g++ -I path/to/s_lib1.h -I path/to/s_lib2.h ... -o output main.cpp
```

2. Consolidate headers into an `include/` directory under the project, then specify that directory once (recommended for your own libraries; avoid moving third-party headers since they may have other dependencies):

```bash
g++ -I include/ -o output main.cpp
```

(Note: the include directory specified with `-I` is combined with `#include "path/to/lib.h"` in code to form the full header path.)

> If you find pure command-line compilation tedious, writing this into `CMakeLists.txt` with CMake is much more convenient.

### Link Library Implementation

> **For non-header-only libraries, you also need to link the library implementation — either dynamic or static.**

#### Link a Dynamic Library

```bash
g++ myapp.cpp -L /path/to/library -l mylib
```

At runtime, it is recommended to place `.dll` files in the same directory as the executable. The dynamic library search order is:

1. Windows (highest to lowest priority):
   - The program's current directory (usually where the `.exe` resides).
   - Windows system directories (e.g., `C:\Windows\System32`).
   - The current user's `AppData` folder.

2. Linux (highest to lowest priority):
   - `LD_LIBRARY_PATH` environment variable (set at runtime)
   - `rpath` / `runpath` embedded in the executable
   - System cache `/etc/ld.so.cache`
   - **System default directories (most common)**: `/lib`, `/usr/lib`, `/usr/local/lib`, `/lib64` (64-bit systems). These are hard-coded into the dynamic linker.

> You can also: 1. Set the `PATH` environment variable. 2. Use `LoadLibrary("D:\\libs\\mylib.dll")` in code to load a DLL explicitly.

#### Link a Static Library

```bash
g++ main.cpp -L /path/to/lib -l <lib_name>
```

Note: during compilation of a static library, only the availability of header files is checked — the compiler does not verify whether third-party libraries exist or are correctly linked. This is because the compilation stage only generates object files (`.o`) and packages them into a `.a` file; linking does not happen yet. A C++ program build can therefore be broken into three stages:

- **Compiling the static library**:
  - Only include headers (`include_directories`) — no need to specify third-party `.a` or `.so` files.
- **Compiling the main program**:
  - Only include the static library's headers.
  - No need to specify third-party `.a` or `.so` files.
- **Linking the main program**:
  - Must explicitly bring in the static library and any third-party libraries it depends on (e.g., `-lthirdparty`).

**Common compiler flags** (command-line compilation):

1. `-I` (uppercase i) + header directory: tells the compiler where to find headers (required)
2. `-L` + library directory: specifies where library files are located
3. `-l` (lowercase L) + library name: specifies the library to link; searches for `.so` or `.a` (Windows: `.dll` and `.lib`); no suffix needed; prefers dynamic libraries

The difference between `-L` and `-l`: `-L` specifies the path where the library lives; `-l` specifies the library name within that path.
