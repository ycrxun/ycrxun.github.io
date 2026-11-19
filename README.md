# 凉都小道

个人技术博客 [ronggle.com](https://ronggle.com) 的 Hugo 源码。

当前主题 **Wayline（径迹）** 位于 `themes/wayline`，采用深色优先的工程笔记视觉风格，支持深色、亮色和暖纸色护眼模式，以及文章目录、代码复制、归档、分类、标签、全文搜索和 Giscus 评论。

主题自托管 Space Grotesk、Noto Sans SC、LXGW WenKai 和 JetBrains Mono，均采用 SIL Open Font License 1.1，可用于商业项目。字体来源和许可证见 `themes/wayline/THIRD_PARTY.md`。

## 影像菜单

影像日志通过 `hugo.yml` 的 `params.gallery.enabled` 控制菜单是否出现，使用照片网格、灯箱和键盘/滑动切换。

正式配置默认读取独立的 `content/gallery/` 内容集合，不会自动复用文章配图。每张照片使用独立页面包：

```text
content/gallery/west-lake-afternoon/
├── index.md
└── cover.jpg
```

```yaml
---
title: 西湖边的午后
date: 2026-11-10
description: 湖面、树影和一段很慢的下午。
image: cover.jpg
location: 杭州
category: 旅记
camera: X100VI
tags: [杭州, 旅行]
link: ""
---
```

照片页可以继续写正文，`link` 是可选的关联页面。只有显式设置 `params.gallery.source: posts` 时，主题才会退回文章配图聚合模式。

## 独立 3D 主题

Wayline 博客主题不再包含 Three.js 世界。完整的 3D 世界、驾驶、文章时间线、影像时间线和阅读徽章已经拆分到独立的 [Wayline World](https://github.com/ycrxun/wayline-world) 主题。

## 本地预览

需要 Hugo Extended 0.146+ 和 Node.js。

```bash
npm install
npm run dev
```

修改 `themes/wayline/assets/scss` 后，如果只运行 Hugo，需要另开一个终端执行：

```bash
npm run styles:watch
```

## 构建

```bash
npm run build
```

站点配置、首页文案和社交入口位于 `hugo.yml`。旧版 Stack 主题仍保留在 `themes/hugo-theme-stack`，仅作为回滚参考，不再被当前配置使用。

[![Netlify Status](https://api.netlify.com/api/v1/badges/f3877b88-735e-47ff-90e7-718e844f7253/deploy-status)](https://app.netlify.com/sites/ycrxun/deploys)
