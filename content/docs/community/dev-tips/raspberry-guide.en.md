---
title: Building a Minecraft Server on an Idle Raspberry Pi
date: 2025-08-05T18:53:40.000Z
tags: null
docId: i0xmpskau105p83vq35wnxls
lang: en
translatedFrom: zh
translatedAt: 2026-04-15T12:00:00Z
translatorAgent: claude-sonnet-4-6
---

A walkthrough of setting up a Raspberry Pi Minecraft server from scratch and exposing it to the internet using FRP port forwarding.

# Hardware Prerequisites

One idle Raspberry Pi, and one VPS server with a public IP address.

# Setting Up the Raspberry Pi

Flash the Raspberry Pi OS image, set up your username and password, then power it on.

## Assign a Static IP to the Raspberry Pi

Open your router's settings panel and find the DHCP static IP allocation section. Assign a fixed IP to your Raspberry Pi. If you've forgotten the current IP, you can check it with:

```shell
$ hostname -I # Example output: 192.168.2.102
```

## Enable VNC Remote Desktop

Log in via SSH and open the configuration panel:

```shell
$ sudo raspi-config
```

1. Select **Interface Options**
2. Select **VNC**
3. When asked **Would you like the VNC Server to be enabled?**, select **YES**

Open a VNC client on your computer and log in with your username and password to access the virtual desktop.

## Install Java

```sh
$ sudo -i # Temporarily gain admin privileges
$ cd /usr/local
```

Open the Raspberry Pi browser and download the [JDK](https://www.oracle.com/java/technologies/downloads/#java21). The file will be in `/home/<your-username>/Downloads/`.

```sh
$ mkdir java
$ mv /home/<your-username>/Downloads/* /usr/local/java/
$ cd java
$ tar -zxvf jdk-21_linux-aarch64_bin.tar.gz
# Some log output will appear
```

Configure environment variables:

```sh
$ nano /etc/profile
```

Add the following at the end of the file:

```sh
# Adjust the JDK version number as needed
export JAVA_HOME=/usr/local/java/jdk-21.0.8
export CLASSPATH=.:$JAVA_HOME/lib/
export PATH=.:$JAVA_HOME/bin:$PATH
# To exit: Ctrl+O, Enter, Ctrl+X
```

Reload the file:

```sh
$ source /etc/profile
```

Verify the installation:

```sh
$ java -version

# Success looks like this:
java version "21.0.8" 2025-07-15 LTS
Java(TM) SE Runtime Environment (build 21.0.8+12-LTS-250)
Java HotSpot(TM) 64-Bit Server VM (build 21.0.8+12-LTS-250, mixed mode, sharing)
```

## Download the Minecraft Server Jar

Open the browser and download the server jar. I'm using the [Fabric](https://fabricmc.net/use/server/) server loader.

```sh
$ cd .. # Should return to /usr/local/
$ mkdir minecraft
$ mv /home/<your-username>/Downloads/* /usr/local/minecraft
```

The first run will fail because you haven't agreed to the EULA yet:

```sh
# My Pi has 8 GB RAM, so I'm allocating 4 GB here
# Note: the jar name will differ depending on the version you downloaded
$ java -Xmx4G -jar fabric-server-mc.1.21.1-loader.0.17.0-launcher.1.1.0.jar
```

Accept the EULA:

```sh
$ nano eula.txt # Change eula=false to eula=true
$ # To exit: Ctrl+O, Enter, Ctrl+X
```

## Configure FRP

The Raspberry Pi uses the ARM architecture. Download [frp](https://github.com/fatedier/frp/releases) — the latest version at the time of writing is 0.63.0.

```sh
$ cd .. # Should be in /usr/local/java
$ wget https://github.com/fatedier/frp/releases/download/v0.63.0/frp_0.63.0_linux_arm64.tar.gz
# Some log output will appear
$ tar -zxvf frp_0.63.0_linux_arm64.tar.gz
# Some log output will appear
$ mv frp_0.63.0_linux_arm64 frp # Rename for convenience
```

Edit the configuration:

```sh
$ cd frp
$ nano frpc.toml # 'c' in frpc stands for client
```

Edit `frpc.toml`:

```toml
serverAddr = "Your VPS public IP"
serverPort = 7000 # Default value
auth.method = "token"
auth.token = "set a password here"

[[proxies]]
name = "choose a service name"
type = "tcp"
localIP = "192.168.2.102" # Raspberry Pi IP
localPort = 25565 # MC server default port
remotePort = 25565 # MC server default port

## To exit: Ctrl+O, Enter, Ctrl+X
```

## Install tmux

This guide uses tmux for session management. You could also use `screen`, but I prefer tmux.

```shell
$ apt install tmux
```

# Setting Up the VPS

Log in via SSH using the root credentials from your provider's welcome email.

## Configure FRP

Install [frp](https://github.com/fatedier/frp/releases) on the VPS:

```shell
$ cd /usr/local
$ wget https://github.com/fatedier/frp/releases/download/v0.63.0/frp_0.63.0_linux_amd64.tar.gz
$ # Some log output will appear
$ tar -zxvf frp_0.63.0_linux_amd64.tar.gz
$ # Some log output will appear
$ mv frp_0.63.0_linux_amd64 frp # Rename for convenience
```

Edit the configuration:

```sh
$ cd frp
$ nano frps.toml # 's' in frps stands for server
```

Edit `frps.toml`:

```toml
bindPort = 7000
auth.method = "token"
auth.token = "same password as on the Raspberry Pi"

[webServer] # Optional dashboard — remove if not needed
addr = "127.0.0.1" # Not exposed publicly; access via SSH tunnel. Use "0.0.0.0" to expose publicly
port = 7500
user = "?"
password = "********"
```

## Run FRP in the Background

Same process as on the Raspberry Pi:

```sh
$ apt install tmux
```

Open the required ports:

```shell
$ ufw allow 7000/tcp
$ ufw allow 25565/tcp
```

Start frp in a tmux session:

```sh
$ tmux new -s <service-name>
$ cd /usr/local/frp
$ ./frps -c frps.toml
# Press Ctrl+B then D to detach
```

Re-attach to the session later:

```shell
$ tmux attach -t <service-name>
```

Verify everything is running:

```sh
$ tmux ls
# frp: 1 windows (created <timestamp>)
$ ss -tlnp | grep 7000
# Output here means frp is working
```

# Starting the Server on the Raspberry Pi

## Write a Start Script

```sh
$ cd /usr/local/minecraft
$ nano start.sh
```

Set the contents of `start.sh` to:

```sh
#!/bin/bash
java -Xmx4G -jar fabric-server-mc.1.21.1-loader.0.17.0-launcher.1.1.0.jar nogui
```

Make it executable:

```shell
$ chmod +x start.sh
```

## Run FRP and the Server

### Run FRP

```sh
$ tmux new -s frp
$ cd /usr/local/frp
$ ./frpc -c frpc.toml
# Press Ctrl+B then D to detach
```

### Run the Server

```sh
$ tmux new -s mcserver
$ cd /usr/local/minecraft
$ ./start.sh
# Press Ctrl+B then D to detach
```

Verify both are running:

```sh
$ tmux ls
# frp: 1 windows (created <timestamp>)
# mcserver: 1 windows (created <timestamp>)
```

# (Optional) Configure a Domain Name

At this point you can already connect to the game using your VPS's public IP:

```
?.?.?.?:25565 # VPS public IP
```

If you have your own domain, log in to the [Cloudflare dashboard](https://dash.cloudflare.com/) and add a DNS record:

|                         |                       |
| :---------------------- | :-------------------- |
| Type                    | A                     |
| Name (required)         | rasp                  |
| IPv4 address (required) | &lt;VPS public IP&gt; |
| Proxy status            | DNS only              |

Then you can connect using your domain:

```
rasp.<your-domain>:25565
```
