---
title: vcpkg包管理器
description: ""
date: "2025-09-29"
tags:
  - tag-one
docId: gtqamuq3tftmvzstbunkgbo5
---

# vcpkg包管理器

vcpkg分经典Classic模式和清单Manifest模式

经典模式是直接vcpkg install下载包，然后在CMakeList.txt中指定include目录和库文件目录引用

清单模式是编写vcpkg.json清单文件

## 配置

下载并配置环境变量：

```bash
git clone <https://github.com/microsoft/vcpkg.git>
cd vcpkg/
./bootstrap-vcpkg.sh
```

之后建议加入环境变量

```bash
echo 'export VCPKG_ROOT="$HOME/vcpkg"' >> ~/.bashrc
// 我是直接clone到了~根目录下，具体换成自己clone到的目录
```

1. 在项目中添加vcpkg

```bash
// 创建清单文件vcpkg.json和vcpkg-configuration.json并初始化
vcpkg new --application
// 添加XXX库（比如fmt）依赖项,将在vcpkg.json中增加一个dependencies:fmt
vcpkg add port fmt // 不会检查正确与否，只是单纯修改vcpkg.json, 与手动修改vcpkg.json一样
```

vcpkg 读取清单文件(vcpkg.json)，以了解要安装和与 CMake 集成的依赖项，从而提供项目所需的依赖项。

1. 在CMakeList.txt中添加库相关信息

```bash
find_package(fmt CONFIG REQUIRED)
target_link_libraries(HelloWorld PRIVATE fmt::fmt)
```

1. 运行CMake配置

创建CMakePresets.json预设文件，设置工具链（CMAKE_TOOLCHAIN_FILE）使用vcpkg自定义工具链时，CMake 可以自动链接 vcpkg 安装的库

```json
{
  "version": 2,
  "configurePresets": [
    {
      "name": "vcpkg",
      "generator": "Ninja", //(或"MinGW Makefiles")这里就是上述用的-G ""
      "binaryDir": "${sourceDir}/build",
      "cacheVariables": {
        "CMAKE_TOOLCHAIN_FILE": "$env{VCPKG_ROOT}/scripts/buildsystems/vcpkg.cmake"
        // 其中{VCPKG_ROOT}可在CMakeUserPresets.json中设置
        // 也可配置成环境变量
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

## 使用

1. 打包自己的库并用vcpkg管理（注册进vcpkg）
2. 下载使用vcpkg管理的库（三方库）

**创建自己的vcpkg注册表**

有别于官方git注册表https://github.com/microsoft/vcpkg

也可以建立自己的git注册表（除了git注册表这种形式，还有文件系统注册表，这里先说git注册表）

**什么是vcpkg注册表？**

注册表里放库的一些信息（但不是库的源码，如果是源码的话，那太臃肿了）。

**做什么用？**

在vcpkg-configuration.json中使用，格式如下

```bash
{
  "default-registry": {
    "kind": "git",
    "repository": "https://github.com/microsoft/vcpkg.git",
    "baseline": "234534dfvbsdvw43434f"
  },  // 默认仓库必须有，加载官方注册表（上千个库）
  "registries": [   // 这里是自定义注册表
    {
      "kind": "git",
      "repository": "https://github.com/xxx/xxx.git", // 仓库地址
      "baseline": "d3e4723c1224t34fsdsvd0e4c2615f6d75",  // 版本基线
      "reference": "main",  // 分支名
      "packages": [
        "datastax-cpp-driver",  // 注册表中包含的库名
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
