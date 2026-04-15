---
title: vcpkg Package Manager
description: ""
date: "2025-09-29"
tags:
  - tag-one
docId: gtqamuq3tftmvzstbunkgbo5
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T08:00:00Z
translatorAgent: claude-sonnet-4-6
---

# vcpkg Package Manager

vcpkg has two modes: **Classic mode** and **Manifest mode**.

Classic mode: run `vcpkg install` to download packages, then specify the include and library directories in `CMakeLists.txt`.

Manifest mode: write a `vcpkg.json` manifest file.

## Configuration

Download and set up the environment:

```bash
git clone <https://github.com/microsoft/vcpkg.git>
cd vcpkg/
./bootstrap-vcpkg.sh
```

Recommended: add vcpkg to your environment variables:

```bash
echo 'export VCPKG_ROOT="$HOME/vcpkg"' >> ~/.bashrc
// adjust the path if you cloned vcpkg somewhere other than ~
```

1. Add vcpkg to your project:

```bash
// create and initialize the manifest files vcpkg.json and vcpkg-configuration.json
vcpkg new --application
// add a dependency (e.g. fmt); this appends "fmt" to the dependencies list in vcpkg.json
vcpkg add port fmt // only modifies vcpkg.json without validation — same as editing the file manually
```

vcpkg reads the manifest (`vcpkg.json`) to determine which dependencies to install and integrate with CMake, providing the packages the project needs.

2. Add library information to `CMakeLists.txt`:

```bash
find_package(fmt CONFIG REQUIRED)
target_link_libraries(HelloWorld PRIVATE fmt::fmt)
```

3. Run the CMake configuration:

Create a `CMakePresets.json` file and set the toolchain (`CMAKE_TOOLCHAIN_FILE`) to point to vcpkg's built-in CMake toolchain. When this toolchain is active, CMake automatically links libraries installed by vcpkg.

```json
{
  "version": 2,
  "configurePresets": [
    {
      "name": "vcpkg",
      "generator": "Ninja", // (or "MinGW Makefiles") — equivalent to the -G "" flag shown earlier
      "binaryDir": "${sourceDir}/build",
      "cacheVariables": {
        "CMAKE_TOOLCHAIN_FILE": "$env{VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake"
        // {VCPKG_ROOT} can be set in CMakeUserPresets.json
        // or configured as an environment variable
      }
    }
  ]
}
```

```json
{
  "version": 2,
  "configurePresets": [
    {
      "name": "default",
      "inherits": "vcpkg",
      "environment": {
        "VCPKG_ROOT": "<path to vcpkg>"
      }
    }
  ]
}
```

## Usage

1. Package your own library and manage it with vcpkg (register it in a vcpkg registry).
2. Download and use third-party libraries managed by vcpkg.

**Creating Your Own vcpkg Registry**

In addition to the official vcpkg git registry at https://github.com/microsoft/vcpkg, you can create your own git registry (there is also a filesystem registry type, but this section focuses on git registries).

**What is a vcpkg registry?**

A registry stores metadata about libraries (not the library source code itself — storing source code would make it bloated).

**What is it used for?**

It is referenced in `vcpkg-configuration.json`, as shown below:

```bash
{
  "default-registry": {
    "kind": "git",
    "repository": "https://github.com/microsoft/vcpkg.git",
    "baseline": "234534dfvbsdvw43434f"
  },  // the default registry is required — it loads the official registry (thousands of packages)
  "registries": [   // custom registries
    {
      "kind": "git",
      "repository": "https://github.com/xxx/xxx.git", // repository URL
      "baseline": "d3e4723c1224t34fsdsvd0e4c2615f6d75",  // version baseline
      "reference": "main",  // branch name
      "packages": [
        "datastax-cpp-driver",  // library names included in this registry
        "cpp-common",
        "ppconsul",
        "leveldb",
        "grpc",
        "polaris-cpp"
      ]
    },
    {
      "kind": "git",
      "repository": "git@gitlab.xxxxx/xxxx.git",
      "baseline": "15efa5017d9a3esdvsdvsdvwecs1d316",
      "reference": "main",
      "packages": [
        "feature-generation-lib",
        "nps-client-brpc",
        "brpc",
        "cybercore-sdk-cpp",
        "opentelemetry-cpp",
        "mv-protocols-cpp",
        "feature-extraction-lib"
      ]
    }
  ]
}
```
