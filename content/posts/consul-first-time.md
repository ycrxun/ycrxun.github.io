---
title: consul学习一-初见
date: 2018-01-07T19:38:00+08:00
featured_image: /consul-first-time/consul-ui.png
categories: 
  - Programming
tags:
    - 服务注册
    - 服务发现
    - KV存储
---

**[Consul](https://www.consul.io)**是HashiCorp公司推出的一款开源工具，用于实现分布式系统的服务发现与配置
<!--more-->

## 什么是Consul

**[Consul](https://www.consul.io)**是HashiCorp公司推出的一款开源工具，用于实现分布式系统的服务发现与配置。它提供了几个关键功能：
- 服务发现：Consul的客户端可以为一些客户端发现给定服务的提供者，诸如api或mysql之类的服务，通过使用DNS或HTTP，应用程序可以很容易地找到它们所依赖的服务。
- 健康检查：Consul的客户端可以提供任何数量的健康检查，或者与给定的服务（“是Web服务器返回200 OK”），或与本地节点（“内存利用率低于90％”）相关联。操作员可以使用此信息来监视群集运行状况，服务发现组件使用此信息将流量从不健康的主机中引导出去。
- KV存储：应用程序可以使用Consul的分层键/值存储，用于任何目的，包括动态配置，功能标记，协调，领导选举等等。简单的HTTP API使其易于使用。
- 多数据中心：Consul支持多个数据中心。这意味着Consul的用户不必担心构建额外的抽象层以扩展到多个区域。

## 基本架构

Consul是一个分布式，高度可用的系统。
![consul](https://www.consul.io/assets/images/consul-arch-420ce04a.png)

向Consul提供服务的每个节点都运行一个Consul代理。 发现其他服务或获取/设置键/值数据不需要运行代理。 代理负责健康检查节点上的服务以及节点本身。

代理与一个或多个Consul服务器通讯。 Consul服务器是数据存储和复制的地方。 服务器自己选出一位领导。 虽然Consul可以在一台服务器上运行，但推荐使用3到5来避免导致数据丢失的故障情况。 每个数据中心都建议使用一组Consul服务器。

需要发现其他服务或节点的基础架构组件可以查询任何Consul服务器或任何Consul代理。 代理自动将查询转发到服务器。

每个数据中心都运行Consul服务器集群。 当发生跨数据中心服务发现或配置请求时，本地Consul服务器将请求转发给远程数据中心并返回结果。

## 简单使用

consul的使用非常简单，其采用Go语言编写，编译出的文件无其他依赖。因此只需要从官方下载对应平台的编译好的二进制可执行程序直接运行就可以了，下载地址[https://www.consul.io/downloads.html](https://www.consul.io/downloads.html)

### 安装

我使用的Linux系统，所以安装如下：
```shell
curl -O https://releases.hashicorp.com/consul/1.0.2/consul_1.0.2_linux_amd64.zip && sudo unzip consul_1.0.2_linux_amd64.zip -d /usr/local/bin/
```

```shell
$ consul
Usage: consul [--version] [--help] <command> [<args>]

Available commands are:
    agent          Runs a Consul agent
    catalog        Interact with the catalog
    event          Fire a new event
    exec           Executes a command on Consul nodes
    force-leave    Forces a member of the cluster to enter the "left" state
    info           Provides debugging information for operators.
    join           Tell Consul agent to join cluster
    keygen         Generates a new encryption key
    keyring        Manages gossip layer encryption keys
    kv             Interact with the key-value store
    leave          Gracefully leaves the Consul cluster and shuts down
    lock           Execute a command holding a lock
    maint          Controls node or service maintenance mode
    members        Lists the members of a Consul cluster
    monitor        Stream logs from a Consul agent
    operator       Provides cluster-level tools for Consul operators
    reload         Triggers the agent to reload configuration files
    rtt            Estimates network round trip time between nodes
    snapshot       Saves, restores and inspects snapshots of Consul server state
    validate       Validate config files/directories
    version        Prints the Consul version
    watch          Watch for changes in Consul

```

### 启动
为了简单起见，我们将暂时在开发者模式中启动Consul代理。这个模式可以非常容易快速地启动一个单节点的Consul环境。当然它并不是用于生产环境下并且它也不会持久任何状态。
```shell
$ consul agent -dev
==> Starting Consul agent...
==> Consul agent running!
           Version: 'v1.0.2'
           Node ID: '14f11e8d-4904-3fcd-1cd5-251c311cf775'
         Node name: 'master.soi.io'
        Datacenter: 'dc1' (Segment: '<all>')
            Server: true (Bootstrap: false)
       Client Addr: [127.0.0.1] (HTTP: 8500, HTTPS: -1, DNS: 8600)
      Cluster Addr: 127.0.0.1 (LAN: 8301, WAN: 8302)
           Encrypt: Gossip: false, TLS-Outgoing: false, TLS-Incoming: false

==> Log data will now stream in as it occurs:

    2018/01/12 22:02:36 [DEBUG] Using random ID "14f11e8d-4904-3fcd-1cd5-251c311cf775" as node ID
    2018/01/12 22:02:36 [INFO] raft: Initial configuration (index=1): [{Suffrage:Voter ID:14f11e8d-4904-3fcd-1cd5-251c311cf775 Address:127.0.0.1:8300}]
    2018/01/12 22:02:36 [INFO] raft: Node at 127.0.0.1:8300 [Follower] entering Follower state (Leader: "")
    2018/01/12 22:02:36 [INFO] serf: EventMemberJoin: master.soi.io.dc1 127.0.0.1
    2018/01/12 22:02:36 [INFO] serf: EventMemberJoin: master.soi.io 127.0.0.1
    2018/01/12 22:02:36 [INFO] consul: Adding LAN server master.soi.io (Addr: tcp/127.0.0.1:8300) (DC: dc1)
    2018/01/12 22:02:36 [INFO] consul: Handled member-join event for server "master.soi.io.dc1" in area "wan"
    2018/01/12 22:02:36 [INFO] agent: Started DNS server 127.0.0.1:8600 (udp)
    2018/01/12 22:02:36 [INFO] agent: Started DNS server 127.0.0.1:8600 (tcp)
    2018/01/12 22:02:36 [INFO] agent: Started HTTP server on 127.0.0.1:8500 (tcp)
    2018/01/12 22:02:36 [INFO] agent: started state syncer
    2018/01/12 22:02:36 [WARN] raft: Heartbeat timeout from "" reached, starting election
    2018/01/12 22:02:36 [INFO] raft: Node at 127.0.0.1:8300 [Candidate] entering Candidate state in term 2
    2018/01/12 22:02:36 [DEBUG] raft: Votes needed: 1
    2018/01/12 22:02:36 [DEBUG] raft: Vote granted from 14f11e8d-4904-3fcd-1cd5-251c311cf775 in term 2. Tally: 1
    2018/01/12 22:02:36 [INFO] raft: Election won. Tally: 1
    2018/01/12 22:02:36 [INFO] raft: Node at 127.0.0.1:8300 [Leader] entering Leader state
    2018/01/12 22:02:36 [INFO] consul: cluster leadership acquired
    2018/01/12 22:02:36 [INFO] consul: New leader elected: master.soi.io
    2018/01/12 22:02:36 [DEBUG] consul: Skipping self join check for "master.soi.io" since the cluster is too small
    2018/01/12 22:02:36 [INFO] consul: member 'master.soi.io' joined, marking health alive
    2018/01/12 22:02:36 [DEBUG] Skipping remote check "serfHealth" since it is managed automatically
    2018/01/12 22:02:36 [INFO] agent: Synced node info
    2018/01/12 22:02:36 [DEBUG] agent: Node info in sync
    2018/01/12 22:02:37 [DEBUG] Skipping remote check "serfHealth" since it is managed automatically
    2018/01/12 22:02:37 [DEBUG] agent: Node info in sync
```

### 集群成员

此时，打开另一个终端，使用`consul members`命令查看：
```shell
$ consul members
Node           Address         Status  Type    Build  Protocol  DC   Segment
master.soi.io  127.0.0.1:8301  alive   server  1.0.2  2         dc1  <all>
```

### 使用server模式运行

```shell
$ consul agent -server -bootstrap -data-dir=$PWD -advertise=192.168.31.28 -client=0.0.0.0 -ui
bootstrap = true: do not enable unless necessary
==> Starting Consul agent...
==> Consul agent running!
           Version: 'v1.0.2'
           Node ID: 'aac96fbf-2ccb-e0a8-2e82-aa4e3ff40d82'
         Node name: 'master.soi.io'
        Datacenter: 'dc1' (Segment: '<all>')
            Server: true (Bootstrap: true)
       Client Addr: [0.0.0.0] (HTTP: 8500, HTTPS: -1, DNS: 8600)
      Cluster Addr: 192.168.31.28 (LAN: 8301, WAN: 8302)
           Encrypt: Gossip: false, TLS-Outgoing: false, TLS-Incoming: false

==> Log data will now stream in as it occurs:

    2018/01/12 22:09:19 [INFO] raft: Initial configuration (index=1): [{Suffrage:Voter ID:aac96fbf-2ccb-e0a8-2e82-aa4e3ff40d82 Address:192.168.31.28:8300}]
    2018/01/12 22:09:19 [INFO] raft: Node at 192.168.31.28:8300 [Follower] entering Follower state (Leader: "")
    2018/01/12 22:09:19 [INFO] serf: EventMemberJoin: master.soi.io.dc1 192.168.31.28
    2018/01/12 22:09:19 [INFO] serf: EventMemberJoin: master.soi.io 192.168.31.28
    2018/01/12 22:09:19 [INFO] consul: Handled member-join event for server "master.soi.io.dc1" in area "wan"
    2018/01/12 22:09:19 [INFO] consul: Adding LAN server master.soi.io (Addr: tcp/192.168.31.28:8300) (DC: dc1)
    2018/01/12 22:09:19 [INFO] agent: Started DNS server 0.0.0.0:8600 (udp)
    2018/01/12 22:09:19 [INFO] agent: Started DNS server 0.0.0.0:8600 (tcp)
    2018/01/12 22:09:19 [INFO] agent: Started HTTP server on [::]:8500 (tcp)
    2018/01/12 22:09:19 [INFO] agent: started state syncer
```

在浏览器中打开[http://localhost:8500](http://localhost:8500)

![consul ui](/consul-first-time/consul-ui.png)
