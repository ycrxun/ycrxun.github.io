---
title: 使用Docker打造自己的云平台
date: 2018-05-13T18:00:59+08:00
featured_image: /cloud-labs/monitor.png
categories: 
  - Programming
tags:
  - Cloud
  - Docker
  - Traefik
  - Portainer
  - Docker UI
---

失踪人口回归，经过几个月的失踪，我又终于回归正轨了，前面没有更博客，主要原因是，因为我实在是太忙（懒）了。
<!--more-->

那么，既然回归，当然是要拿出干货咯。

今天说点什么呢？沉寂了这么久，也一直在做与Docker相关的工作与学习，就记录下最近的一些内容，主要是为了防止自己又忘了，每次都要去找各种文档，没法快速复制出一份自己玩过的东西。

## 目标

使用Docker搭建一个自己的”云平台“，大概就是，可以在上面部署应用，并且自动暴露出来。

![traefik](/cloud-labs/monitor.png)

![potainer](/cloud-labs/console.png)

![potainer services](/cloud-labs/console-services.png)

## 前期准备

- [Docker](https://www.docker.com/)
- [Traefik](https://traefik.io/)
- [Portainer](https://www.portainer.io/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Docker Swarm](https://docs.docker.com/engine/swarm/)

以上是我们需要前期准备好的，包括它们分别是什么、怎么安装、怎么使用？

因为篇幅问题，在此不一一详细节介绍，如果你感兴趣，希望你能够自己通过搜索引擎自行了解，如果有什么问题，你可以联系我。

## Traefik

**Træfɪk** 是一个为了让部署微服务更加便捷而诞生的现代HTTP反向代理、负载均衡工具。 它支持多种后台 (Docker, Swarm, Kubernetes, Marathon, Mesos, Consul, Etcd, Zookeeper, BoltDB, Rest API, file…) 来自动化、动态的应用它的配置文件设置。

![traefik](/cloud-labs/traefik.png)

我们用它作什么呢？没错，反向代理和负载均衡，同时因为其提供了好用的动态功能，使得我们可以用它配置域名动态的功能。

怎么理解呢？假设我现在有了一个域名`cloud-labs.io`，然后为使用这个域名配置了一个“云平台”，然后为希望我在这个平台部署一个应用`nina`,部署完成后，为就可以使用`nina.cloud-labs.io`进行访问，并不在乎我的运用被具体部署到哪里。

那么，要怎么做呢？

如果使用了traefik，其实很简单，我们只需要将应用作为一个`backend`暴露给traefik即可。如果结合Docker使用，为们只需要在Label上加上对应的配置即可。

下面我们一起来部署traefik吧！

前提条件，你已经安装号Docker以及初始化完成Docker Swarm，当然你也可以只使用Docker模式，你可以参考traefik的[官方文档](https://docs.traefik.io/configuration/backends/docker/)。

### 新建stack编排文件

```yaml
version: '3.3'
services:
  proxy:
    image: traefik
    command: --web --docker --docker.domain=cloud-labs.io --docker.watch --docker.swarmmode=true --logLevel=DEBUG
    deploy:
      labels:
        - traefik.backend=traefik
        - traefik.frontend.rule=Host:monitor.cloud-labs.io
        - traefik.port=8080
        - traefik.docker.network=traefik_proxy
    networks:
      - proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /dev/null:/traefik.toml
networks:
  proxy
```

如上，我们开启了traefik的`web`、`docker`、`docker swarm`功能，并且把它的`web`功能暴露到`monitor.cloud-labs.io`，当我们部署完成后，就可以使用`monitor.cloud-labs.io`进行访问。

### 部署traefik

部署其实很简单，为采用的stack模式部署的traefik，命令如下：
```bash
$ ls
traefik.yml

$ docker stack deploy -c traefik.yml traefik

```
稍等一会儿，就可以在使用`monitor.cloud-labs.io`访问了。

> 当然，`monitor.cloud-labs.io`是一个假定的域名，需要在你的host文件中进行配置。
> $ cat /etc/hosts
> 127.0.0.1  monitor.cloud-labs.io

## Portainer

**Portainer**是一个轻量级管理用户界面，可让你轻松管理不同的Docker环境（Docker主机或Swarm集群）。其使用与部署一样简单，它包含一个可以在任何Docker引擎上运行的容器（可以作为Linux容器或Windows本机容器部署）。并允许你管理Docker容器，图像，卷，网络等等！它与独立的Docker引擎和Docker Swarm模式兼容。

正如它的介绍那般，为们可以使用它作为我们的“云平台”的控制台，来作为我们平时的应用部署、管理、配置的WebUI，让我们的操作更加人性化。

### 新建stack编排文件

```yaml
version: '3.3'
services:
  server:
    image: portainer/portainer
    command: -H unix:///var/run/docker.sock
    networks:
      - traefik_proxy
    deploy:
      labels:
        - traefik.backend=portainer
        - traefik.frontend.rule=Host:console.cloud-labs.io
        - traefik.docker.network=traefik_proxy
        - traefik.port=9000
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer:/data

networks:
  traefik_proxy:
    external: true

volumes:
  portainer
```

如上，为们将会把Portainer部署到Docker环境中，同时将其暴露到了traefik中，使用`console.cloud-labs.io`进行访问。在这里，你可能会发现，为们并没有为portainer配置暴露的端口，这也是因为traefik给我们带来的一个好处，便是为们不需要在我们的物理机上开启那么多的端口映射，为们知道，如果端口映射过多时，我们会在难以管理、感知，往往会出现端口已经使用的情况下导致部署失败。

> 值得注意的是，我们的Portainer的网络设置：
> ```yaml
> networks:
>   traefik_proxy: 
>     external: true
> ```
> 是的，我们使用的是traefik的网络，因为我们希望它能够被traefik发现，并作反向代理和负载均衡。

### 部署Portainer

部署Portainer也很简单，为们使用stack进行部署：

```bash
$ ls
portainer.yml

$ docker stack deploy -c portainer.yml portainer
```
稍等一会儿，就可以在使用`monitor.cloud-labs.io`中发现我们的应用以及部署好了，并且被暴露在`console.cloud-labs.io`。

![traefik monitor portainer](/cloud-labs/monitor-portainer.png)

> 同样的，`console.cloud-labs.io`是一个假定的域名，需要在你的host文件中进行配置。
> $ cat /etc/hosts
> 127.0.0.1  console.cloud-labs.io

## 部署运用

上面，我们已经把我们“云平台”的反向代理、负载均衡组件traefik，以及控制台portainer部署完毕，那么我们接下来就使用我们的“云平台”来部署一个应用吧！

接下来，我们来部署一个比较简单的应用。

### 登入控制台

登陆我们“云平台”的控制台后，选择stack，为们来编排一下我们的应用。

![portainer stack gitea](/cloud-labs/portainer-stack-gitea.png)

### 进入Traefik

当我们在控制台部署完成我们的gitea后，我们可以在Traefik的WebUI中看到，我们的gitea已经部署完成，并暴露在`git.cloud-labs.io`，这时我们可以访问`git.cloud-labs.io`来进行gitea的配置。

### 应用预览

配置完成gitea后我们可以看到如下：

![gitea](/cloud-labs/gitea.png)

## 总结

通过这次实战，你是否有收获呢？如果有，请为自己鼓掌，如果没有，那你也别责怪我，因为我其实真的是为了让自己记住。

好吧，我会把最后的文件整理下，放到我的Github上，仓库为[cloud-labs](https://github.com/ycrxun/cloud-labs)。
