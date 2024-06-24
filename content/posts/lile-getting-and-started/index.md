---
title: Lile简单介绍
description: Lile是Go中的gRPC服务和一组工具/库的应用程序生成器
date: 2019-07-07T17:47:56+08:00
slug: lile-getting-and-started
image: lile.png
categories:
    - Programming
tags:
    - gRPC
    - Go
---


继续挖坑，希望将来能静下心来，安静的补坑。

[Lile](https://github.com/lileio/lile)是Go中的gRPC服务和一组工具/库的应用程序生成器（类似于create-react-app，rails new或django startproject）。
<!--more-->

Lile的主要焦点是在创建新服务时通过创建基本结构，测试示例，Dockerfile，Makefile等。

Lile带有基本的预设置，带有可插拔选项，适用于......

- Metrics (例如[Prometheus](https://prometheus.io/))
- Tracing (例如[Zipkin](https://zipkin.io/))
- PubSub (例如[Google PubSub](https://cloud.google.com/pubsub/docs/overview))
- Service Discovery

## 安装

安装Lile非常简单，使用`go get`就可以安装lile的命令行工具，用于生成新的服务和所需的库。

首先，您需要安装Google的[Protocol Buffers](https://developers.google.com/protocol-buffers/)。

```bash
$ brew install protobuf
$ go get -u github.com/lileio/lile/...
```

## 快速开始

使用`lile new`生成新服务。

```bash
$ lile new lileio/users
```

## 指南

- [创建服务](#创建服务)
- [服务定义](#服务定义)
- [生成RPC方法](#生成RPC方法)
- [编写并运行测试用例](#编写并运行测试用例)
- [使用生成的命令行](#使用生成的命令行)
- [添加你自己的命令行](#添加你自己的命令行)

### 创建服务
Lile附带一个“代码生成器”，可以快速生成新的Lile服务。

Lile遵循Go关于$GOPATH的约定（参见如何写Go），并且自动解析您的新服务的名称，以在正确的位置创建服务。

如果您的Github用户名是`lileio`，并且您想创建一个新的服务为了发布消息到Slack，您可以使用如下命令：
```bash
lile new lileio/slack
```
这将创建一个项目到`$GOPATH/src/github.com/lileio/slack`

### 服务定义
Lile服务主要使用[gRPC](https://grpc.io/)，因此使用[protocol buffers](https://developers.google.com/protocol-buffers/)作为接口定义语言（IDL），用于描述有效负载消息的服务接口和结构。 如果需要，可以使用其他替代品。

我强烈建议您先阅读[Google API](https://cloud.google.com/apis/design/)设计文档，以获得有关RPC方法和消息的一般命名的好建议，以及如果需要，可以通过[gRPC Gateway](https://github.com/grpc-ecosystem/grpc-gateway)将其转换为REST/JSON。

下面是一个简单的例子`account_service`：

```protobuf
service AccountService {
  rpc List (ListAccountsRequest) returns (ListAccountsResponse) {}
  rpc GetById (GetByIdRequest) returns (Account) {}
  rpc GetByEmail (GetByEmailRequest) returns (Account) {}
  rpc AuthenticateByEmail (AuthenticateByEmailRequest) returns (Account) {}
  rpc GeneratePasswordToken (GeneratePasswordTokenRequest) returns (GeneratePasswordTokenResponse) {}
  rpc ResetPassword (ResetPasswordRequest) returns (Account) {}
  rpc ConfirmAccount (ConfirmAccountRequest) returns (Account) {}
  rpc Create (CreateAccountRequest) returns (Account) {}
  rpc Update (UpdateAccountRequest) returns (Account) {}
  rpc Delete (DeleteAccountRequest) returns (google.protobuf.Empty) {}
}
```
### 生成RPC方法

默认情况下，Lile将创建一个RPC方法和一个简单的请求和响应消息。

```proto
syntax = "proto3";
option go_package = "github.com/lileio/slack";
package slack;

message Request {
  string id = 1;
}

message Response {
  string id = 1;
}

service Slack {
  rpc Read (Request) returns (Response) {}
}

```

我们来修改一下使它能够提供真正的服务，并添加自己的方法。

我们来创建一个Announce方法向Slack发布消息。

我们假设Slack团队和身份验证已经由服务配置来处理，所以我们服务的用户只需要提供一个房间和他们的消息。 该服务将发送特殊的空响应，因为我们只需要知道是否发生错误，也不需要知道其他任何内容。

现在我们的proto文件看起来像这样：
```proto
syntax = "proto3";
option go_package = "github.com/lileio/slack";
import "google/protobuf/empty.proto";
package slack;

message AnnounceRequest {
  string channel = 1;
  string msg = 2;
}

service Slack {
  rpc Announce (AnnounceRequest) returns (google.protobuf.Empty) {}
}
```

现在我们运行protoc工具我们的文件，以及Lile生成器插件。

```bash
protoc -I . slack.proto --lile-server_out=. --go_out=plugins=grpc:$GOPATH/src
```

Lile提供了一个Makefile，每个项目都有一个已经配置的proto构建步骤。 所以我们可以运行它。

```bash
make proto
```

我们可以看到，Lile将在server目录中为我们创建两个文件。

```bash
$ make proto
protoc -I . slack.proto --lile-server_out=. --go_out=plugins=grpc:$GOPATH/src
2017/07/12 15:44:01 [Creating] server/announce.go
2017/07/12 15:44:01 [Creating test] server/announce_test.go
```

我们来看看Lile为我们创建的`announce.go`文件。

```go
package server

import (
    "errors"

    "github.com/golang/protobuf/ptypes/empty"
    "github.com/lileio/slack"
    context "golang.org/x/net/context"
)

func (s SlackServer) Announce(ctx context.Context, r *slack.AnnounceRequest) (*empty.Empty, error) {
  return nil, errors.New("not yet implemented")
}
```

接下来我们实现这个生成的方法，让我们从测试开始吧！

### 编写并运行测试用例

当您使用Lile生成RPC方法时，也会创建一个对应的测试文件。例如，给定我们的`announce.go`文件，Lile将在同一目录中创建`announce_test.go`

看起来如下:

```go
package server

import (
	"testing"

	"github.com/lileio/slack"
	"github.com/stretchr/testify/assert"
	context "golang.org/x/net/context"
)

func TestAnnounce(t *testing.T) {
	ctx := context.Background()
	req := &slack.AnnounceRequest{}

	res, err := cli.Announce(ctx, req)
	assert.Nil(t, err)
	assert.NotNil(t, res)
}
```

您现在可以使用`Makefile`运行测试，并运行`make test`命令:

```bash
$ make test
=== RUN   TestAnnounce
--- FAIL: TestAnnounce (0.00s)
        Error Trace:    announce_test.go:16
        Error:          Expected nil, but got: &status.statusError{Code:2, Message:"not yet implemented", Details:[]*any.Any(nil)}
        Error Trace:    announce_test.go:17
        Error:          Expected value not to be nil.
FAIL
coverage: 100.0% of statements
FAIL    github.com/lileio/slack/server  0.011s
make: *** [test] Error 2

```
我们的测试失败了，因为我们还没有实现我们的方法，在我们的方法中返回一个“未实现”的错误。

让我们在announce.go中实现Announce方法，这里是一个使用nlopes的[slack library](https://github.com/nlopes/slack)的例子。

```bash
package server

import (
	"os"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/golang/protobuf/ptypes/empty"
	"github.com/lileio/slack"
	sl "github.com/nlopes/slack"
	context "golang.org/x/net/context"
)

var api = sl.New(os.Getenv("SLACK_TOKEN"))

func (s SlackServer) Announce(ctx context.Context, r *slack.AnnounceRequest) (*empty.Empty, error) {
	_, _, err := api.PostMessage(r.Channel, r.Msg, sl.PostMessageParameters{})
	if err != nil {
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	return &empty.Empty{}, nil
}
```

我们再次修改我们的测试用力，然后再次运行我们的测试:

```go
package server

import (
	"testing"

	"github.com/lileio/slack"
	"github.com/stretchr/testify/assert"
	context "golang.org/x/net/context"
)

func TestAnnounce(t *testing.T) {
	ctx := context.Background()
	req := &slack.AnnounceRequest{
		Channel: "@alex",
		Msg:     "hellooo",
	}

	res, err := cli.Announce(ctx, req)
	assert.Nil(t, err)
	assert.NotNil(t, res)
}
```

现在如果我使用我的Slack令牌作为环境变量运行测试，我应该看到通过测试！

```bash
$ alex@slack: SLACK_TOKEN=zbxkkausdkasugdk make test
go test -v ./... -cover
?       github.com/lileio/slack [no test files]
=== RUN   TestAnnounce
--- PASS: TestAnnounce (0.32s)
PASS
coverage: 75.0% of statements
ok      github.com/lileio/slack/server  0.331s  coverage: 75.0% of statements
?       github.com/lileio/slack/slack   [no test files]
?       github.com/lileio/slack/slack/cmd       [no test files]
?       github.com/lileio/slack/subscribers     [no test files]
```

### 使用生成的命令行

生成服务时，Lile会基于[cobra](https://github.com/spf13/cobra)生成命令行程序。您可以使用自己的cmd扩展应用程序，也可以使用内置cmds来运行服务。

运行不带任何参数的cmd行应用程序将打印生成的帮助。

例如`go run orders/main.go`

#### 启动

运行`up`将同时运行RPC服务器和发布订阅的订阅者。

### 添加你自己的命令行

要添加自己的cmd，您可以使用Cobra内置的生成器来生成更多的命令。

```bash
$ cd orders
$ cobra add import
```

您现在可以编辑生成的文件，以创建您的命令行，cobra会自动将命令行的名称添加到帮助中。