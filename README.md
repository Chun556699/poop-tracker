<p align="center">
  <img src="./miniprogram/images/logo.svg" width="120" height="120" alt="拉个翔 Logo">
</p>

<h1 align="center">🚽 拉个翔 (Poop Tracker)</h1>

<p align="center">
  <strong>科学记录排便健康的微信小程序 · 基于布里斯托大便分类法</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/微信小程序-云开发-07C160?style=flat-square&logo=wechat&logoColor=white" alt="WeChat">
  <img src="https://img.shields.io/badge/基础库-3.16.0+-blue?style=flat-square" alt="libVersion">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" alt="PRs Welcome">
</p>

---

## 📋 目录

- [项目介绍](#-项目介绍)
- [主要功能](#-主要功能)
- [截图预览](#-截图预览)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [云开发配置](#-云开发配置)
- [DeepSeek AI 分析配置](#-deepseek-ai-分析配置)
- [开源协议](#-开源协议)

---

## 🎯 项目介绍

**「拉个翔」** 是一款基于 **[布里斯托大便分类法 (Bristol Stool Scale)](https://zh.wikipedia.org/wiki/%E5%B8%83%E9%87%8C%E6%96%AF%E6%89%98%E5%A4%A7%E4%BE%BF%E5%88%86%E7%B1%BB%E6%B3%95)** 的排便健康记录工具。

> 💡 布里斯托大便分类法将人类大便分为 7 种类型，从 `1型（严重便秘）` 到 `7型（严重腹泻）`，是医学界广泛使用的肠道健康评估工具。

**为什么做这个 App？**

- 🏥 排便习惯是肠道健康的「晴雨表」，但很少有人系统记录
- 📊 通过持续记录和统计分析，帮助你发现饮食、作息与肠道健康之间的关系
- 🤗 用轻松可爱的视觉风格，让「记录拉翔」不再尴尬

---

## ✨ 主要功能

### 📝 排便记录
- 记录每次排便的**日期、时间、时长**
- 通过 **布里斯托大便分类选择器** 直观地选择大便类型（🌰 硬球 → 💧 水样）
- 可附加**照片**、**备注文字**
- 支持云端保存或本地缓存（无网络也可用）

### ⏱️ 马桶计时器
- 进入厕所时 **一键开始计时**，出来后自动停止
- 时长自动填充到记录中，无需手动估算

### 📊 数据大盘
- **今日概览**：今日次数、平均时长、最近记录
- **趋势图表**：按日统计的排便频率柱状图
- **类型分布**：各布里斯托类型的占比统计
- **健康评分**：3型+4型（健康便便）占比
- **日历视图**：月份日历上直观展示每天排便情况

### 🏆 排行榜
- 按周/月/全部统计用户的排便次数排名
- 与全球用户一起「愉快地比拼肠道健康」
- 匿名保护，可选展示昵称

### 🤖 AI 智能分析（可选）
- 基于 **DeepSeek API** 的大模型分析
- 根据记录数据生成个性化肠道健康建议

### 👤 个人中心
- 微信头像/昵称登录
- 布里斯托科学知识普及（7种类型详解）
- 本地缓存管理

---

## 📸 截图预览

| 首页 | 记录页 | 统计大盘 | 排行榜 | 个人中心 |
|:---:|:---:|:---:|:---:|:---:|
| ![首页](https://via.placeholder.com/200x400?text=Home) | ![记录](https://via.placeholder.com/200x400?text=Record) | ![统计](https://via.placeholder.com/200x400?text=Stats) | ![排行](https://via.placeholder.com/200x400?text=Leaderboard) | ![我的](https://via.placeholder.com/200x400?text=Mine) |

> ⌛ _截图待更新 — 欢迎贡献真实截图！_

---

## 🛠 技术栈

| 层级 | 技术 |
|:---|:---|
| **前端框架** | 微信小程序原生框架 (WXML + WXSS + JS) |
| **后端** | 微信云开发 (CloudBase) |
| **云数据库** | 微信云数据库 (MongoDB-like) |
| **云函数** | Node.js (wx-server-sdk) |
| **AI 引擎** | DeepSeek API (deepseek-v4-flash) |
| **CI/CD** | 微信开发者工具 + 云开发控制台 |

---

## 📁 项目结构

```
poop-tracker/
├── miniprogram/                          # 小程序前端代码
│   ├── app.js                            # 入口文件（云初始化、全局数据）
│   ├── app.json                          # 全局配置（页面路由、TabBar）
│   ├── app.wxss                          # 全局样式
│   ├── config.js                         # DeepSeek API 配置
│   ├── sitemap.json                      # 微信搜索配置
│   ├── components/                       # 自定义组件
│   │   └── bristol-selector/             #   布里斯托类型选择器
│   ├── images/                           # 图标与图片资源
│   ├── pages/                            # 页面
│   │   ├── index/                        #   首页（今日概览 + 计时器）
│   │   ├── record/                       #   记录/编辑记录
│   │   ├── stats/                        #   统计大盘（图表 + 日历）
│   │   ├── leaderboard/                  #   排行榜
│   │   └── mine/                         #   个人中心
│   └── utils/                            # 工具类
│       └── timer.js                      #   计时器核心逻辑
├── cloudfunctions/                       # 微信云函数
│   ├── getOpenid/                        #   获取用户 OpenID
│   ├── getLeaderboard/                   #   获取排行榜数据
│   ├── syncProfile/                      #   同步用户资料至云端
│   └── deepseekAnalysis/                 #   DeepSeek AI 分析（待实现）
├── scripts/                              # 辅助脚本
├── project.config.json                   # 微信项目配置
├── project.private.config.json           # 私人项目配置（请勿提交密钥）
└── README.md                             # 本文件（你正在看的）
```

---

## 🚀 快速开始

### 前置要求

1. 注册 [微信小程序](https://mp.weixin.qq.com/) 账号
2. 下载安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
3. 开通 [微信云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html) 并创建一个环境

### 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/your-username/poop-tracker.git
cd poop-tracker

# 2. 用微信开发者工具打开项目根目录
#    - 填入你的 AppID（在 project.config.json 中修改）
#    - 确保「云开发」开关已开启

# 3. 初始化云数据库集合
#    在微信开发者工具 → 云开发 → 数据库中创建以下集合：
#    - poop_records    （排便记录）
#    - user_profiles   （用户资料）

# 4. 上传云函数
#    在 cloudfunctions/ 每个目录上右键 → 上传并部署

# 5. 在 config.js 中填入你的 DeepSeek API Key（可选）
```

> ⚠️ **注意**：`project.private.config.json` 和 `config.js` 中的 `DEEPSEEK_API_KEY` 属于私有信息，**切勿提交到公开仓库**。这两个文件已在 `.gitignore` 中排除，请复制 `config.example.js` 为 `config.js` 并填入你的真实密钥：

---

## ☁️ 云开发配置

### 云数据库集合

| 集合名 | 说明 | 权限 |
|:---|:---|:---|
| `poop_records` | 排便记录 | 仅创建者可读写 |
| `user_profiles` | 用户资料 | 仅创建者可读写 |

### 云函数

| 函数名 | 触发器 | 说明 |
|:---|:---|:---|
| `getOpenid` | 小程序启动时 | 获取当前用户的微信 OpenID |
| `getLeaderboard` | 排行榜页加载时 | 聚合统计全局用户排便次数排行 |
| `syncProfile` | 用户授权登录时 | 将昵称/头像同步至 user_profiles |

### 降级策略

当云开发不可用时（网络问题或未部署云函数），App 会自动降级为 **本地存储模式**：

- 使用 `wx.setStorageSync` / `wx.getStorageSync` 存储记录
- 排行榜仅显示当前用户的本地数据
- 用户无感切换，不影响核心功能使用

---

## 🤖 DeepSeek AI 分析配置

本项目集成了 DeepSeek API 进行智能分析（功能预留，可自行实现云函数逻辑）：

```js
// 复制 miniprogram/config.example.js 为 config.js，填入你的密钥
// miniprogram/config.js
module.exports = {
  DEEPSEEK_API_KEY: 'sk-your-deepseek-api-key-here',  // 你的 DeepSeek API Key
  DEEPSEEK_MODEL: 'deepseek-v4-flash',                // 使用的模型
  DEEPSEEK_API_URL: 'https://api.deepseek.com/chat/completions'
};
```

> 🔒 **安全提示**：建议通过云函数中转调用 DeepSeek API，避免在前端暴露 API Key。

---

## 🤝 贡献指南

欢迎任何形式的贡献！无论是新功能、Bug 修复、文档改进还是 UI 设计优化。

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feat/amazing-feature`)
3. 提交你的改动 (`git commit -m 'feat: add some amazing feature'`)
4. 推送到分支 (`git push origin feat/amazing-feature`)
5. 发起 Pull Request

### 开发规范

- **代码风格**：遵循微信小程序官方推荐
- **commit 格式**：参考 [Conventional Commits](https://www.conventionalcommits.org/)
- **颜色主题**：莫兰迪色系 — 主色 `#8FAF9F`（莫兰迪绿），辅色 `#D9C3B0`（暖沙色）

---

## 📄 开源协议

本项目基于 **MIT License** 开源 — 详见 [LICENSE](LICENSE) 文件。

```
MIT License

Copyright (c) 2024 poop-tracker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
...
```

---

<p align="center">
  <strong>拉个翔 🚽 记录肠道健康，从今天开始</strong><br>
  <sub>如果你的肠道会说话，它一定会感谢你开始记录 ✨</sub>
</p>

<br>

<p align="center">
  <a href="#-拉个翔-poop-tracker">⬆️ 回到顶部</a>
</p>
