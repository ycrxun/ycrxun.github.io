# 凉都小道

个人技术博客 [ronggle.com](https://ronggle.com) 的 Hugo 源码。

当前主题 **Wayline（径迹）** 位于 `themes/wayline`，采用深色优先的工程笔记视觉风格，支持深色、亮色和暖纸色护眼模式，以及文章目录、代码复制、归档、分类、标签、全文搜索和 Giscus 评论。

主题自托管 Space Grotesk、Noto Sans SC、LXGW WenKai 和 JetBrains Mono，均采用 SIL Open Font License 1.1，可用于商业项目。字体来源和许可证见 `themes/wayline/THIRD_PARTY.md`。

## 影像菜单

影像日志通过 `hugo.yml` 的 `params.gallery.enabled` 控制菜单是否出现，通过 `source` 指定内容集合。默认读取 `posts` 中带 `image` 的文章；如果要在独立照片集合中展示，可建立 `content/moments/` 页面包，并将 `source` 改为 `moments`。

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
