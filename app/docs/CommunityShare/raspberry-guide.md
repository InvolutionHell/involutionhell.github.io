---
title: 用闲置树莓派搭建一个Minecraft服务器
description: "记录一下从0开始搭建一个树莓派minecraft服务器，并且使用FRP内网穿透到公网"
abbrlink: 52c73bb6
date: 2025-08-05 18:53:40
tags:
---

# 硬件准备工作

一台空闲的树莓派，一台有公网IP地址的VPS服务器

# 配置树莓派

安装树莓派OS镜像，配置用户名密码
给树莓派通电

## 固定树莓派的静态IP

打开路由器设置面板，找到DHCP静态IP分配，给树莓派固定一个IP
如果忘了也可以用指令查看树莓派的IP

```shell
$ hostname -I # 示例输出：192.168.2.102
```

## 开启VNC远程桌面

登录ssh开启设置面板

```shell
$ sudo raspi-config
```

1. 选择 **Interface Options**
2. 选择 **VNC**
3. **Would you like the VNC Server to be enabled?** 选择 **YES**

打开自己电脑上的VNC软件，使用用户名密码登录虚拟桌面

## 安装java

```sh
$ sudo -i # 临时获得管理员权限
$ cd /usr/local
```

打开树莓派的浏览器 下载[jdk](https://www.oracle.com/java/technologies/downloads/#java21)，此时文件会在`/home/<你的用户名>/Downloads/`目录下

```sh
$ mkdir java
$ mv /home/<你的用户名>/Downloads/* /usr/local/java/
$ cd java
$ tar -zxvf jdk-21_linux-aarch64_bin.tar.gz
# 会输出一些日志
```

配置环境变量

```sh
$ nano /etc/profile
```

在文件最后添加

```sh
# jdk版本号可能不同，注意辨别
export JAVA_HOME=/usr/local/java/jdk-21.0.8
export CLASSPATH=.:$JAVA_HOME/lib/
export PATH=.:$JAVA_HOME/bin:$PATH
# 退出方法：Ctrl+O，Enter，Ctrl+X
```

重载文件

```sh
$ source /etc/profile
```

检查是否安装成功

```sh
$ java -version

# 看见如下类似输出则表示成功
java version "21.0.8" 2025-07-15 LTS
Java(TM) SE Runtime Environment (build 21.0.8+12-LTS-250)
Java HotSpot(TM) 64-Bit Server VM (build 21.0.8+12-LTS-250, mixed mode, sharing)
```

## 下载mc服务端

打开浏览器下载安装包，我用[fabric](https://fabricmc.net/use/server/)端

```sh
$ cd .. # 应该退回至/usr/local/
$ mkdir minecraft
$ mv /home/<你的用户名>/Downloads/* /usr/local/minecraft
```

首次运行必定失败，因为没有同意eula协议

```sh
# 我的树莓派8G，这里配置4G内存
# 注意安装包的名字，版本不同，名字必定不一样
$ java -Xmx4G -jar fabric-server-mc.1.21.1-loader.0.17.0-launcher.1.1.0.jar
```

同意eula协议

```sh
$ nano eula.txt # 将其改为eula=true
$ # 退出方法：Ctrl+O，Enter，Ctrl+X
```

## 配置frp

树莓派是arm架构，下载[frp](https://github.com/fatedier/frp/releases)，本文编写的时候最新版本为0.63.0

```sh
$ cd .. # 当前的目录应该在/usr/local/java
$ wget https://github.com/fatedier/frp/releases/download/v0.63.0/frp_0.63.0_linux_arm64.tar.gz
# 会输出一些日志
$ tar -zxvf frp_0.63.0_linux_arm64.tar.gz
# 会输出一些日志
$ mv frp_0.63.0_linux_arm64 frp # 改个名字方便后续操作
```

编辑配置信息

```sh
$ cd frp
$ nano frpc.toml # 这里frpc中的c代表client客户端
```

编辑`frpc.toml`

```toml
serverAddr = "VPS公网IP地址"
serverPort = 7000 # 默认值
auth.method = "token"
auth.token = "设一个密码"

[[proxies]]
name = "取一个服务名字"
type = "tcp"
localIP = "192.168.2.102" # 树莓派IP地址
localPort = 25565 # mc开服默认值
remotePort = 25565 # mc开服默认值

## 退出方法：Ctrl+O，Enter，Ctrl+X
```

## 安装tmux

本文使用tmux实现，也有screen的用法，但是我喜欢tmux。

```shell
$ apt install tmux
```

# 配置VPS

ssh登录邮件里的root账户

## 配置frp

在VPS端安装[frp](https://github.com/fatedier/frp/releases)

```shell
$ cd /usr/local
$ wget https://github.com/fatedier/frp/releases/download/v0.63.0/frp_0.63.0_linux_amd64.tar.gz
$ # 会输出一些日志
$ tar -zxvf frp_0.63.0_linux_amd64.tar.gz
$ # 会输出一些日志
$ mv frp_0.63.0_linux_amd64 frp # 改个名字方便后续操作
```

编辑配置文件

```sh
$ cd frp
$ nano frps.toml # 这里frps中的s代表server服务端
```

编辑`frps.toml`

```toml
bindPort = 7000
auth.method = "token"
auth.token = "和树莓派一样的密码"

[webServer] # 开dashboard功能，不需要可以不配置
addr = "127.0.0.1" # 不暴露在公网，可通过ssh隧道访问，要暴露在公网则为"0.0.0.0"
port = 7500
user = "?"
password = "********"
```

## 后台运行frp

同树莓派端操作

```sh
$ apt install tmux
```

开放frp监听的端口7000和mc服务器用到的端口25565

```shell
$ ufw allow 7000/tcp
$ ufw allow 25565/tcp
```

打开一个新窗口运行frp

```sh
$ tmux new -s <服务名字>
$ cd /usr/local/frp
$ ./frps -c frps.toml
# Ctrl+B再按D，退出窗口
```

重回窗口

```shell
$ tmux attach -t <服务名字>
```

检查功能是否开启，看到注释中的输出则正常运作

```sh
$ tmux ls
# frp: 1 windows (created 时间..)
$ ss -tlnp | grep 7000
# 有输出则frp工作正常
```

# 在树莓派中启动服务器

## 编写start脚本

```sh
$ cd /usr/local/minecraft
$ nano start.sh
```

将`start.sh`修改为如下

```sh
#!/bin/bash
java -Xmx4G -jar fabric-server-mc.1.21.1-loader.0.17.0-launcher.1.1.0.jar nogui
```

添加执行权限

```shell
$ chmod +x start.sh
```

## 运行frp和服务器

### 运行frp

```sh
$ tmux new -s frp
$ cd /usr/local/frp
$ ./frpc -c frpc.toml
# Ctrl+B再按D，退出窗口
```

### 运行服务器

```sh
$ tmux new -s mcserver
$ cd /usr/local/minecraft
$ ./start.sh
# Ctrl+B再按D，退出窗口
```

检查功能是否开启，看到如下输出则正常运行

```sh
$ tmux ls
# frp: 1 windows (created 时间..)
# mcserver: 1 windows (created 时间..)
```

# （可选）配置域名

现在已经可以通过VPS的公网IP登录游戏进行游玩了

```
?.?.?.?:25565 # VPS公网IP
```

如果有自己的域名，可以登录[cloudflare dashboard](https://dash.cloudflare.com/)，在DNS中添加记录
示例：
| | |
| :- | :- |
| 类型 | A |
| 名称（必需） | rasp |
| IPv4 地址（必需） | <VPS公网IP> |
| 代理状态 | 仅DNS |

就可以通过你的域名登录了

```
rasp.<你的域名>:25565
```
