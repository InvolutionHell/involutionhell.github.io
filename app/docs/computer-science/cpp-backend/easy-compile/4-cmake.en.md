---
title: CMake
description: ""
date: "2025-09-29"
tags:
  - tag-one
docId: xk44lx4q1gpcm1uqk8nnbg7q
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T08:00:00Z
translatorAgent: claude-sonnet-4-6
---

# CMake

[https://juejin.cn/post/6844903557183832078](https://juejin.cn/post/6844903557183832078) — A CMake tutorial on Juejin

[https://zhuanlan.zhihu.com/p/97369704](https://zhuanlan.zhihu.com/p/97369704) — A CMake tutorial on Zhihu

CMake is used to compile a C++ project into an executable or a static/dynamic library.

## CMake Commands

Run `cmake --help` for more information.

1. CMake requires a `CMakeLists.txt`, or you can pass parameters manually when invoking CMake.
2. It is recommended to create a `build/` directory inside the project directory, then run CMake from there (you can also specify the build directory with `--build`).

```bash
cmake .. // append any extra parameters not declared in CMakeLists.txt (most parameters are usually declared there)
```

Running CMake from the `build/` directory keeps generated files (intermediate and final) separate from the project source. `..` tells CMake that `CMakeLists.txt` and the source code are in the parent directory (the project root).

CMake works in two steps: first it generates build system files, then it uses those files to perform the actual build. The key commands are:

1. Generate using a preset

```bash
cmake --preset=default
```

This generates:

- `build.ninja`
- `CMakeCache.txt`
- `CMakeFiles/`
- `cmake_install.cmake`
- `vcpkg_installed/`
- `vcpkg-manifest-install.log`

Besides using a preset, you can also specify options manually:

Use `-S` to set the source directory and `-B` to set the build directory. For example:

`cmake -S .` sets the current directory as the source directory (the CMake variable **`CMAKE_SOURCE_DIR`** holds this path).

2. Build

```bash
cmake --build vcpkg-build   // build into vcpkg-build; no need to cd into build/ and run cmake .. separately
```

This generates (in addition to the files from step 1):

- `build.ninja`
- `CMakeCache.txt`
- `CMakeFiles/`
- `cmake_install.cmake`
- `libfeature-extraction-lib.a` (the compiled static library, new compared to step 1)
- `vcpkg_installed/`
- `vcpkg-manifest-install.log`

## CMakeLists.txt

### Understanding `find_package` in Depth

```
find_package(<LibraryName> [optional args: CONFIG REQUIRED])
```

`find_package` does **not** eagerly load all components of a library. Components are loaded lazily when referenced by `target_link_libraries` or other commands that need them. It merely declares a global target.

`CONFIG` — use the library's own config file (e.g., `spdlogConfig.cmake`) rather than CMake's built-in find module.

`REQUIRED` — abort with an error if the package is not found.

### `.cmake` Files

`CMakeLists.txt` and `.cmake` files share exactly the same syntax. A `.cmake` file is essentially a reusable module for `CMakeLists.txt`. Include one as follows:

```makefile
include(cmakes/gtests_main.cmake)
include(cmakes/gtests_fe.cmake)
```

Typically used with conditionals, for example to enable unit tests optionally:

```makefile
option(BUILD_TESTS "Build tests" OFF)
if (BUILD_TESTS)
    include(cmakes/gtests_main.cmake)
    include(cmakes/gtests_fe.cmake)
endif ()
```

### CMake Parameters and Their g++ Equivalents

Every CMake command parameter has a corresponding g++ flag, except for internal-only parameters (helpers used within the CMake script itself).

**Required configuration items in `CMakeLists.txt` and their g++ equivalents:**

1. **Define the build target** — executable or library

```cmake
add_executable(my_program main.cpp)
// or
add_library(my_library STATIC my_library.cpp)
```

`add_executable` corresponds to:

```bash
g++ -o my_program main.cpp
```

`add_library` corresponds to:

```bash
g++ -c my_library.cpp -o my_library.o
ar rcs libmy_library.a my_library.o
```

2. **Link dependency libraries**

```cmake
target_link_libraries(my_program gtest gtest_main)
```

3. **Include directories** (for your own headers and third-party headers)

```cmake
include_directories(my_program PRIVATE /path/to/include)
// or
target_include_directories(my_program PRIVATE /path/to/include)
```

4. **Set build type**

```cmake
CMAKE_BUILD_TYPE
```

**CMake-internal parameters (no g++ equivalent):**

1. Specify the minimum CMake version: `cmake_minimum_required(VERSION 3.10)`
2. Set project name and version: `project(ProjectName VERSION 1.0 LANGUAGES CXX)`
3. Find a package: `find_package(PackageName CONFIG REQUIRED)`

**Package search order** (from ChatGPT — may need revision):

CMake searches for a package's config file in this order:

- Paths specified in the `CMAKE_PREFIX_PATH` environment variable.
- System default install paths (e.g., `/usr/lib/cmake`, `/usr/local/lib/cmake`).
- The path specified by `CMAKE_INSTALL_PREFIX`.
- If using a package manager like vcpkg, the path specified in its toolchain file.

(Default vcpkg path: `[vcpkg-root]/installed/[triplet]/share/[package]/[package]Config.cmake`)

For reference:

- Package headers install to: `[vcpkg-root]/installed/[triplet]/include/`
- Library files install to: `[vcpkg-root]/installed/[triplet]/lib/`

### Running Without `CMakeLists.txt`

Required command-line parameters when not using a `CMakeLists.txt`:

1. Specify the source directory (required)
2. Set build type: `-D CMAKE_BUILD_TYPE=Release` or `Debug`
3. Choose a build generator:
   - `-G "Unix Makefiles"` — Unix make generator
   - `-G "MinGW Makefiles"` — Windows make generator
   - `-G "Ninja"` — Ninja generator (requires separate installation)
   - `-G "Visual Studio 16 2019"` — Visual Studio 2019 generator
   - `-G "Xcode"` — Apple Xcode generator
