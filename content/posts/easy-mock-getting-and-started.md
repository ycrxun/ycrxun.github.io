---
title: Easy Mock 试玩
date: 2017-09-03T12:38:11+08:00
featured_image: /easy-mock-getting-and-started/my-project.png
categories: 
  - Programming
tags:
  - API
  - mock
  - RESTful
  - 微服务
---

在过去的开发模式中，或许是一群人坐在一起，风风火火的一起码一个项目，大家在一起，口头沟通交流，并不太涉及到跨团队间的数据调用，基本上涉及的API也是不断沟通修改。
<!--more-->

## 不搭的前言

而今，开发的项目庞大而且复杂，涉及多个模块，跨多个项目组，如果再按照口头沟通协调，很难想象是多么艰难。而在日常的一些开发过程中，我们也需要不停的对自己开发的代码进行调试，比如某些公司，有些产品线根本没有稳定的开发环境提供给开发人员使用，那么，怎么办，只能使用mock的方式。

说到mock，其实我也再使用，有时候，不能每时每刻都调用真实的服务，我们就会再自己项目中设置开关，当再开发环境下时，使用自己再本地文件中伪造的数据，这些文件有JSON、TXT、CSV/EXCEL，往往再不同的模块和借口会写很多不同的Mock数据处理的逻辑，没有复用性，且没有良好的版本控制与管理。

那么要怎么处理这些Mock数据呢？今天我们来试玩一下Easy Mock。

## 什么是Easy Mock

伪造数据，我们更高效；但，不仅于此。

这是Easy Mock的[官网](https://www.easy-mock.com)上面的介绍。

Easy Mock是一个极其简单、高效、可视化、并且能快速生成模拟数据的在线Mock服务。以项目管理的方式组织Mock数据，能帮助我们更好的管理Mock数据，不怕丢失。

### 特性
- 支持接口代理
- 支持快捷键操作
- 支持协同编辑
- 支持团队项目
- 支持 Restful
- 支持 Swagger 1.2 & 2.0
  - 基于 Swagger 快速创建项目
  - 支持显示接口入参与返回值
  - 支持显示实体类
- 支持灵活性与扩展性更高的响应式数据开发
- 支持 Mock.js 语法
- 支持 restc 方式的接口预览

> [在线使用文档](https://easy-mock.com/docs)  
> [Easy Mock CLI](https://github.com/easy-mock/easy-mock-cli) - 基于 Easy Mock 快速生成 api.js 的命令行工具。

## 数据伪造

我前面也提到过，我们才有的是编程式的伪造数据，利用请求拦截或者配置文件开关，来切换我们的正常数据请求与Mock数据。

这些方法虽然可以解决我们的问题，但同样伴随着一些问题，比如说，依赖特定的框架，主要体现再我们使用spring的配置文件profile作为切换开关；又比如，脏代码，主要是我们会带项目源码中以编程的方式伪造Mock数据；又比如说，这些数据没法统一管理，变更困难等等。his

说到以上的这些困难，可能还是没能触及你的痛点，但是无所谓了，哈哈哈，接下来，我们试试Easy Mock吧。

## 安装

> 在开始之前，假设你已经成功安装了 Node.js (v7.4 以上) 和 MongoDB (v3.4 以上)

> 注意，在安装项目依赖时，bcrypt需要c++编译环境g++，如果你没有安装，那需要自行安装
> > $ sudo dnf install gcc-c++ # 注意，本屌使用的是Fedora，你需要根据自己的操作系统找到安装方式

```shell
$ git clone https://github.com/easy-mock/easy-mock.git
$ cd easy-mock && npm install
```

## 配置

> 不同环境会加载不同的配置文件，在此之前你应该对 node-config 有所了解。

```shell
$ pwd
/home/soi/web/easy-mock
$ cd config
$ cat default.json
{
  "port": 7300,
  "pageSize": 30,
  "routerPrefix": {
    "mock": "/mock",
    "api": "/api"
  },
  "db": "mongodb://192.168.31.28:27017/easy-mock",
  ...
}
```
> 注意，这里我们需要配置的是MongoDB，可以不配置其他的。如果你需要一些高级用法，你可以参考github仓库的文档进行配置。

## 启动

```shell
$ npm run dev
```

> 这里使用的开发模式启动，可以在你的浏览器中访问`http://127.0.0.1:7300`  
> 更多命令：  
> $ npm run build # 前端静态资源构建打包  
> $ npm run start # 以生产环境方式启动，需要提前执行 build  
> $ npm run test # 测试  
> $ npm run lint # 语法检测

## 使用

### 登录页

![easy mock login](/easy-mock-getting-and-started/login.png)

![easy mock login input](/easy-mock-getting-and-started/login-input.png)

> 注意，这里如果你没有用户名和密码的话，直接输入用户名密码，会给新建一个用户

### 个人项目

登录成功后，进入我的个人项目面板。

![easy mock project](/easy-mock-getting-and-started/my-project.png)

点击项目可以查看项目接口列表。

![easy mock project api](/easy-mock-getting-and-started/my-project-api.png)

### 团队项目

- 首先，我们来初始化一个团队。

![easy mock team](/easy-mock-getting-and-started/my-team-new.png)

- 新建团队项目

![easy mock team project](/easy-mock-getting-and-started/my-team-project-new.png)

- 编辑项目API

![easy mock team project api](/easy-mock-getting-and-started/my-team-project-api-edit.png)

- 预览项目API

![easy mock team project api previw](/easy-mock-getting-and-started/my-team-project-api-preview.png)

## 后语

这里我就水完了一篇博客了，对你有没有帮助我不知道。

不过首先的感谢下[大搜车无线架构团队](http://f2e.souche.com/blog/)给我们开源这个好用的Mock神器。
