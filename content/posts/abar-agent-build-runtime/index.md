---
title: "ABAR：让 Agent 成为可治理的运行单元"
description: "ABAR 用不可变 Revision、长期 Session、异步 Message 和结构化 Runtime Event，重新回答 Agent 如何从演示走向真实业务运行。"
slug: abar-agent-build-runtime
date: 2026-11-19T00:00:00+08:00
draft: true
categories:
    - Programming
tags:
    - ABAR
    - Agent
    - Rust
    - 架构
    - AI 工程
---

做一个能回答问题的 Agent 并不难。

接入一个模型、拼几段 Prompt、注册两个 Tool，再写一个循环，一个看起来完整的 Demo 很快就能跑起来。可一旦把它交给真实业务，问题会立刻换一个方向：谁能修改 Agent 的能力边界？一次写操作由谁批准？服务重启后任务从哪里继续？外部系统超时后应该重试还是等待？模型看到的敏感字段由谁负责移除？

这些问题已经不属于 Prompt 工程，也不是再增加一层 Agent 编排就能自然解决。

[ABAR](https://github.com/ycrxun/abar)（Agent Build And Runtime）尝试从一个更基础的位置回答它们：**把 Agent 当作一种可发布、可执行、可恢复、可治理的运行单元。**

它的核心链路很短：

```text
Agent Revision -> Session -> Message -> Runtime Event
```

ABAR 使用 Rust 实现，定位是一个“薄而业务中立”的 Agent Build/Runtime 核心。它不试图定义所有业务，也不把某个模型厂商、某个聊天页面或某套工作流固化成平台本身。

## 为什么不是再写一个 Agent 框架

大多数 Agent 框架首先关心的是“如何完成一次推理”：怎样组织 Prompt，如何调用 Tool，怎样维护短期记忆，以及如何把多个步骤串起来。

这些能力当然重要，但真实业务还会追问另一组问题：

- Agent 现在运行的是哪个版本？
- 修改 Prompt 和扩大 Tool 权限，是不是同一类变更？
- 一个长期会话是否可以跨越多次任务和多个进程继续存在？
- 写操作在执行前，审批人看到的是不是精确参数？
- 服务重启后，正在运行的任务如何恢复？
- 外部写请求结果未知时，系统是否会悄悄重复调用？
- 哪些数据可以进入模型上下文，哪些必须被拒绝？
- 平台管理员能看到业务对话和最终输出吗？

ABAR 把这些要求收进了核心模型，而不是留给每个业务项目各自补一套不可复用的基础设施。

## 四个核心对象

ABAR 用四个对象描述 Agent 的生命周期。

### Agent Revision：Agent 的可发布制品

Revision 不是一段临时 Prompt，而是一个经过解析、校验和封存的不可变版本。它由四部分组成：

```text
Agent Revision
├── resourceScope
├── behavior
├── knowledgeSources
└── toolBindings
```

`resourceScope` 固定 Tool ID 与最大 effect、Skill ID、Knowledge Source ID、数据类别、模型类别和最大步骤数。

`behavior` 固定带摘要的 Prompt、Skill 与业务规则引用。

这种拆分带来一个重要区别：**行为变化和资源扩张不是同一种发布风险。**

修改措辞、调整工作方法或更新普通知识文档，可以生成新的 Current Revision；如果新增写 Tool、扩大数据范围或引入新的能力边界，Revision 会进入 `waiting_review`，等待 Scope Review。

Agent 因此不再是一组运行时配置，而是一个可追踪、可审核、可回滚的软件制品。

### Session：长期上下文，而不是一次任务

Session 归属于一个已认证的 Tenant 和用户，是长期上下文容器。它不是进程、容器或单次任务。

一个 Session 同时只能有一个活动 Message，但可以在 `active`、`idle`、`closed` 和 `archived` 之间迁移。用户可以在同一个 Session 内继续追问、调整条件或确认执行。

这条边界很重要。业务用户面对的是一段连续协作关系，而平台内部的执行单元仍然可以保持清晰。

### Message：一次受约束的执行

Message 是某个 Agent Revision 的一次实际执行。

它不是只保存“用户说了什么”和“模型回答了什么”，而是记录输入、请求的 Skill、使用的 Revision、实际模型、Tool、Knowledge、Schema、Tool 结果、审批证据、checkpoint、输出和 Runtime Event。

执行状态也不是一个简单的成功或失败：

```text
queued -> running
running -> waiting_approval | waiting_external | completed | failed | cancelled
waiting_approval -> running | failed | cancelled
waiting_external -> running | failed | cancelled
```

当外部写操作结果未知时，Message 会停在 `waiting_external`，保存精确 Tool ID、参数和幂等键。系统不会因为连接超时就静默重发写请求。

### Runtime Event：执行过程本身也是数据

只保存最终输出，无法解释一次 Agent 为什么这样做。

ABAR 同时记录结构化 Runtime Event、Tool 证据、审批决定、checkpoint 和 Token 计量。日志、诊断与指标围绕这些状态构建，同时避免把 Token、Secret、Prompt、完整 Tool 参数或业务输出直接写进日志。

这让“可观测”不再只等于一个耗时数字，而是能回答执行在哪里停下、等待什么、使用了哪些证据，以及恢复后从哪里继续。

## Build：把 Agent 定义成业务契约

ABAR 把一个业务 Agent 拆成一组可读文件：

```text
my-agent/
├── agent.yaml
├── scope.yaml
├── behavior.yaml
├── knowledge.yaml
├── tools.yaml
├── prompt/
│   └── system.md
├── skills/
│   └── <skill-id>/SKILL.md
└── rules/
    └── <rule-id>.md
```

这里最值得注意的是 `scope.yaml`：

```yaml
tools:
  read:
    - inventory.query_*
  write:
    - inventory.create-transfer-order

skills:
  - transfer-decision

knowledgeSources:
  - transfer-policy

data:
  allow:
    - inventory
    - sales
  deny:
    - cost
    - gross-margin
```

它回答的不是“Agent 可能会做什么”，而是“Agent 最多可以接触什么”。

`abar publish` 会读取 Revision 项目，检查 Source 路径，计算各部分的摘要，生成保守的 Scope Diff，并不可变地保存 Revision。资源范围扩大时必须经过审核；只有行为和内容变化时，才允许直接移动 Current 指针。

Agent 的权限边界因此从 Prompt 里的文字约定，变成了 Build 阶段可以验证、可以比较、可以审核的契约。

## Runtime：模型产生意图，系统决定是否执行

ABAR 的一条核心安全不变量是：

> 模型只产生意图，不获得执行权限。

一次 Message 的执行路径可以简化为：

```text
Message
  -> Context Assembly
  -> Model
  -> Tool Intent
  -> Scope and DataPolicy
  -> Tool Execution
  -> Evidence / Approval / External Wait
  -> Result or Recovery
```

模型可以提出 Tool 调用，但调用必须先通过 Revision 范围和 effect 校验。

读操作可以在同一持久意图下安全重试；写操作则必须进入审批链路，并使用精确参数与幂等键。Tool 结果在进入模型上下文之前还要经过 DataPolicy 投影，禁止字段会被移除，敏感值也会阻止其出现在模型输出中。

这套设计并没有假设模型一定会遵守 Prompt。它假设模型可能出错，因此把真正的授权放在模型之外。

## 审批不是弹出一个确认框

在很多系统里，“人工审批”只是一个确认按钮。

ABAR 对写审批的定义更具体：审批证据必须绑定 Tool ID、精确参数、Agent Revision、幂等键和 Approval ID；审批不能跨 Message 或 Revision 复用。

审批权限还是独立的 `ApprovalAuthorizer` 边界。用户通过身份认证，不代表他自动拥有批准业务写操作的权力。

审批收件箱只暴露同一 Tenant 内、当前角色有权处理的最小待调用证据，不返回申请人的 Session 历史、最终输出、Composition 或 Tool 结果。

身份、申请、批准和执行因此被拆成四个不同层次。

## 恢复不是重新执行一遍

Agent 运行时最容易被低估的问题是恢复。

ABAR 把恢复所需状态保存在 Worker 之外，包括 Session 与 Message 记录、Execution Composition、审批和待外部调用证据、checkpoint、Tool 结果以及 append-only Runtime Event。

服务启动后：

- `queued` Message 重新派发；
- `running` Message 从 checkpoint 或已批准写继续；
- `waiting_approval` 保持挂起，等待新的审批决定；
- `waiting_external` 查询精确持久 Tool 调用，而不是重新发起另一个写请求。

这使“重启恢复”不等于“再执行一次”。恢复恢复的是同一次业务意图。

## 身份边界：浏览器为什么不接触 IdP Token

ABAR 的 WebUI 在 OIDC 模式下使用 Authorization Code + PKCE，并作为 Backend for Frontend 运行。

浏览器只持有不透明的 `HttpOnly`、`SameSite=Lax` 会话 Cookie。Access Token 和 Refresh Token 只保存在 WebUI 服务端内存；写请求还需要会话绑定的 CSRF Token。浏览器不会直接接触 ABAR Server Bearer Token，也不会接触 IdP Access Token。

Server 端可以启用严格 OIDC Introspection，校验 Active、Issuer、Audience 和过期时间，再通过 UserInfo 解析 Subject、Tenant 与 Roles。

这里的目标不是“在浏览器里多藏一个 Token”，而是从结构上避免 Token 进入前端执行环境。

## 两类界面，两条治理边界

ABAR 没有把业务使用和平台治理塞进同一个界面。

Agent WebUI 面向业务用户：

- 选择 Agent；
- 创建和继续 Session；
- 多轮追问；
- 确认写操作；
- 查看执行证据、审批结果和 Runtime 状态；
- 取消或等待外部对账。

Platform Console 面向平台管理员：

- 查看 Agent 与 Revision 目录；
- 处理 Scope Review；
- 查看当前 Tenant 的 Runtime 聚合；
- 查看平台健康状态。

Platform Console 不接收 Session 对话、Prompt、完整 Tool 参数或最终业务输出。

“能运行 Agent”和“能治理 Agent 平台”是两种不同职责，也应该拥有不同的最小数据视图。

## 从商品运营场景验证核心

ABAR 没有用许多互不相关的示例来证明能力，而是围绕一个统一的商品运营助手，把核心路径走到底。

用户可以直接问：

```text
看看华东库存异常门店，判断应该补货、配货还是门店间调拨
```

Agent 根据同一个业务上下文识别配货、补货或调拨意图，选择对应 Tool，并在写操作前进入审批。

示例中包含确定性的 OpenAI-compatible 模型、Mock MCP Server、业务规则、知识文档、View Pack、钉钉经理告警和端到端脚本。另有 300 门店规模的试点负载测试，以及离线状态备份与恢复。

一个业务场景不是“示例数量少”，而是让 Build、Runtime、数据策略、审批、恢复、WebUI、控制面和测试围绕同一组真实对象闭合。

## ABAR 主动不做什么

“薄核心”也意味着明确承认边界。

ABAR 的 Worker 是进程内实现，跨进程分布式租约不属于这个薄核心；组织 IAM 仍属于外部 `AuthProvider`；模型、Tool、Knowledge、DataPolicy 和 ContentProvider 都通过 Adapter 扩展；诊断接口只读，并按调用者隔离。

它不试图成为一套完整 Agent OS，也不要求业务把所有能力塞进同一个进程。

ABAR 更关心的是：无论最终由哪个模型、哪组 Tool 或哪个业务系统参与执行，Revision、授权、审批、恢复和证据这些不变量始终成立。

## 最后

Agent 从 Demo 走向生产，难点很少是“它能不能回答一次”。

真正困难的是，当它连续运行几个月、经历多次发布、接入多个外部系统、面对不同角色和真实写操作之后，系统是否仍然能够回答：

谁允许它这样做？它现在是什么版本？这一次执行进行到哪里？证据是什么？失败之后从哪里继续？

ABAR 给出的答案是四个对象、一条短执行链，以及一组不依赖模型自觉的安全边界。

这也是它最像“运行时”，而不是“聊天框架”的地方。
