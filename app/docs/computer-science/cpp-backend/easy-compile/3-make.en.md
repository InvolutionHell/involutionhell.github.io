---
title: Building with Make
description: ""
date: "2025-09-29"
tags:
  - cpp-backend
  - makefile
  - build-system
docId: g6wucmr69lamd9xyxm7uunnd
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T08:00:00Z
translatorAgent: claude-sonnet-4-6
---

# Building with Make

### 1. How `make` Works

`make` manages the build process based on **file dependencies** and **timestamps**, following these steps:

1. Read the `Makefile`: `make` parses the `Makefile` to obtain build rules.
2. **Check target modification times**: `make` compares timestamps to decide whether to rebuild. For example, if `source.c` is newer than `source.o`, `make` considers `source.o` stale and re-runs the relevant compile command.
3. **Execute build rules**: if a target needs rebuilding, `make` runs the compilation and linking commands according to the dependency graph until the final target (executable or library) is produced.

### 2. Basic `Makefile` Structure

A `Makefile` is the configuration file `make` reads. It defines build rules, targets, dependencies, and commands. A typical `Makefile` contains:

### Basic Syntax

- **Target**: the file to build (usually an object file or the final executable).
- **Dependency**: files the target depends on. If a dependency is updated, the target must be rebuilt.
- **Command**: the shell command that produces the target (e.g., a compile command). Commands **must be indented with a TAB character**.

```makefile
target: dependencies
    command
```

### 3. `Makefile` Example

Suppose we have a simple C++ project with two source files, `main.cpp` and `utils.cpp`, which produce object files `main.o` and `utils.o`, and are ultimately linked into the executable `myapp`.

```makefile
CC = g++                # compiler: g++
CFLAGS = -Wall -g       # compile flags: -Wall enables all warnings, -g includes debug info

# object files
OBJS = main.o utils.o

# executable
TARGET = myapp

# default target
all: $(TARGET)

$(TARGET): $(OBJS)      # executable depends on object files
    $(CC) $(OBJS) -o $(TARGET)   # link command: produces the executable

main.o: main.cpp utils.h
    $(CC) $(CFLAGS) -c main.cpp  # compile command: produces main.o

utils.o: utils.cpp utils.h
    $(CC) $(CFLAGS) -c utils.cpp # compile command: produces utils.o

clean:
    rm -f $(OBJS) $(TARGET)       # remove intermediate and target files
```

Targets serve as the entry points for execution.
