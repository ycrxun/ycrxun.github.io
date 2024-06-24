---
title: 使用gRPC开发微服务-开始
description: 
date: 2018-08-12T17:44:33+08:00
slug: setup-microservies-via-grpc
image: grpc.svg
categories:
    - Programming
tags:
    - 微服务
    - gRPC
    - 容器
    - 从入门到放弃
---


## 什么是gRPC

[gRPC](https://grpc.io/)是一个现代的开源高性能RPC框架，可以在任何环境中运行。它可以有效地连接数据中心内和跨数据中心的服务，并提供可插拔的支持，以实现负载平衡，跟踪，健康检查和身份验证。它支持多种语言。
<!--more-->

gRPC使用[Protocol Buffers](https://developers.google.com/protocol-buffers/)作为IDL定义服务，Protocol Buffers是一个功能强大的二进制序列化工具集和语言。

![grpc.io](grpc.svg)

### 主要使用场景

- 在微服务式架构中有效地连接多语言服务
- 将移动设备，浏览器客户端连接到后端服务
- 生成高效的客户端库

### 核心功能

- 10种语言的客户端库
- 高效和简单的服务定义框架
- 基于http/2的传输的双向流
- 可插拔身份验证，跟踪，负载平衡和健康检查

> 安装和前期准备请参阅官方文档。

## 前置条件

- [Protocol Buffers](https://developers.google.com/protocol-buffers/)
- [Golang](https://golang.org/)

## 一个简单的开始

### 使用Protocol Buffers定义服务

```proto
syntax = "proto3";

package add;

message AddRequest {
  uint64 a = 1;
  uint64 b = 2;
}

message AddResponse {
  uint64 result = 1;
}

service AddService {
  rpc Add (AddRequest) returns (AddResponse) {}
}

```
### 项目结构

```bash
.
├── add
│   ├── cmd
│   │   ├── client.go
│   │   ├── root.go
│   │   └── server.go
│   └── main.go
├── add.pb.go
├── add.proto
└── server
    └── server.go

```

### 生成代码

```bash
$ pwd
/home/soi/golang/src/github.com/ycrxun/add

$ protoc -I . add.proto --go_out=plugins=grpc:.
```

当我们执行完命令后，会在当前文件夹上生成一个`add.pb.go`文件，这个文件我们不需要去动，但是我们生成的这个文件中有我们定义的AddServiceServer的接口，需要我们去实现。

```golang
// AddServiceServer is the server API for AddService service.
type AddServiceServer interface {
	Add(context.Context, *AddRequest) (*AddResponse, error)
}
```

### 实现AddServiceServer

```bash
$ pwd
/home/soi/golang/src/github.com/ycrxun/add

$ mkdir server

$ touch server/server.go

```

然后在`server.go`中定义一个struct`AddServer`,并且实现`AddServiceServer`的`Add`方法。
```golang
package server

import (
	"context"

	"github.com/ycrxun/add"
)

// AddServer struct for AddService
type AddServer struct {
}

// Add method
func (a AddServer) Add(ctx context.Context, r *add.AddRequest) (*add.AddResponse, error) {
	rs := r.A + r.B
	s := add.AddResponse{
		Result: uint64(rs),
	}
	return &s, nil
}

```

到此，我们已经实现了我们的业务逻辑部分，但是并不能对外提供服务，所以我们要完成我们的gRPC的server。

### 实现Server端

```bash
$ pwd
/home/soi/golang/src/github.com/ycrxun/add/add

$ ls
cmd  main.go

$ cat main.go 
package main

import "github.com/ycrxun/add/add/cmd"

func main() {
	cmd.Execute()
}

$ cat cmd/root.go 
package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "add",
	Short: "grpc add service simple.",
}

// Execute cmd
func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(-1)
	}
}

```

> 为了后续的操作，我们最好按照这种结构去写，当然，你也可以不这么写。

接下来，我们去实现我们的gRPC Server
```golang
package cmd

import (
	"net"

	"github.com/ycrxun/add"
	"github.com/ycrxun/add/server"

	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"google.golang.org/grpc"
)

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Run the RPC server",
	Run: func(cmd *cobra.Command, args []string) {
		logrus.Fatal(runServe())
	},
}

func runServe() error {
  lis, err := net.Listen("tcp", ":8000")
  logrus.Infof("add serve at %s", "0.0.0.0:8000")
	if err != nil {
		return err
	}
	s := grpc.NewServer()
	add.RegisterAddServiceServer(s, &server.AddServer{})
	return s.Serve(lis)
}

func init() {
	rootCmd.AddCommand(serveCmd)
}

```

至此，我们的gRPC server以及我们的业务逻辑就完成了。

是不是很鸡冻呢？

接下来我们来编译并运行起来。

```bash
$ pwd
/home/soi/golang/src/github.com/ycrxun/add/add

$ go build

$ ls
add  cmd  main.go

$ ./add serve
INFO[0000] add serve at 0.0.0.0:8000
```

### 编写客户端

上面我们已经编写并完成了gRPC server及其业务逻辑，并可以对外提供服务了，这时候我们需要使用一个客户端去调用我们的服务，为了方便测试，我们选择使用[iris](https://iris-go.com/)来构建一个HTTP的API对外提供服务。

```golang
package cmd

import (
	"context"

	"github.com/kataras/iris"
	"github.com/sirupsen/logrus"
	"github.com/spf13/cobra"
	"github.com/ycrxun/add"
	"google.golang.org/grpc"
)

var clientCmd = &cobra.Command{
	Use:   "client",
	Short: "Run the RPC client",
	Run: func(cmd *cobra.Command, args []string) {
		logrus.Fatal(runClient())
	},
}

func runClient() error {

  // 建立一个grpc连接
	cc, err := grpc.Dial("0.0.0.0:8000", grpc.WithInsecure())
	if err != nil {
		return err
	}

  // 创建AddService的客户端
	cl := add.NewAddServiceClient(cc)

	app := iris.New()

	app.Get("/:a/:b", func(ctx iris.Context) {
		a, _ := ctx.Params().GetInt64("a")
		b, _ := ctx.Params().GetInt64("b")

		c := context.Background()
		rs, err := cl.Add(c, &add.AddRequest{A: uint64(a), B: uint64(b)})
		if err != nil {
			ctx.Text(err.Error())
			return
		}
		ctx.JSON(rs)
	})
	return app.Run(iris.Addr(":8100"))
}

func init() {
	rootCmd.AddCommand(clientCmd)
}

```

到此，我们的客户端也完成了，接下来为们重新编译下，并依次将服务端，客户端启动起来。

```bash
$ pwd
/home/soi/golang/src/github.com/ycrxun/add/add

$ go build

$ ./add serve
INFO[0000] add serve at 0.0.0.0:8000
```

重新开一个终端
```bash
$ ./add client
Now listening on: http://localhost:8100
Application started. Press CTRL+C to shut down.
```
打开浏览器，输入`http://localhost:8100/1/1`
```json
{"result":2}
```
