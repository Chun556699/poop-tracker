---
name: poop-tracker-miniprogram
overview: 开发基于微信小程序和微信云开发（CloudBase）的「排便记录与智能分析」小程序，支持布里斯托大便分类记录、照片上传、云数据库同步、图表分析，并通过云函数对接 DeepSeek API 实现智能健康分析报告。
design:
  architecture:
    component: tdesign
  styleKeywords:
    - Minimalism
    - Morandi Warm Pastel
    - Healing
    - Clean UI
  fontSystem:
    fontFamily: PingFang SC
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#8FAF9F"
      - "#D9C3B0"
      - "#A7C2B2"
    background:
      - "#FAF8F5"
      - "#FFFFFF"
    text:
      - "#4A4A4A"
      - "#8C8C8C"
    functional:
      - "#E8A08A"
      - "#FFFFFF"
todos:
  - id: project-init
    content: 初始化微信小程序项目结构，配置 project.config.json 及 app.json 路由和全局样式
    status: completed
  - id: component-bristol
    content: 开发布里斯托分类选择组件，绘制 1-7 型图标与说明文案
    status: completed
    dependencies:
      - project-init
  - id: page-record
    content: 实现排便记录页面，支持时间选择、时长滑块、形状选取、图片上传与云数据库写入
    status: completed
    dependencies:
      - component-bristol
  - id: page-index
    content: 完成首页展示，包括今日概览、最近记录卡片，并集成一键记录跳转导航
    status: completed
    dependencies:
      - page-record
  - id: page-stats
    content: 完成统计大盘，使用 Canvas / WXSS 绘制排便趋势、形状比例及日期筛选器
    status: completed
    dependencies:
      - page-record
  - id: cloud-deepseek
    content: 编写 deepseekAnalysis 云函数，通过系统 Prompt 构造安全且深度的健康建议生成器
    status: completed
    dependencies:
      - project-init
  - id: page-analysis
    content: 完成 AI 智能分析页面，支持一键生成最近 7 天的健康报告及历史报告列表展示
    status: completed
    dependencies:
      - cloud-deepseek
  - id: page-mine
    content: 设计并完成个人中心，提供数据多端同步状态展示、布里斯托分类科普卡片及关于页面
    status: completed
    dependencies:
      - project-init
---

## 产品概述

一款温馨、简洁、美观的排便记录与健康管理微信小程序。采用治愈系莫兰迪暖绿/奶茶配色，消除生理记录的尴尬感，帮助用户科学追踪肠道健康。通过布里斯托大便分类法（1-7型）进行直观分类，结合小程序云开发（CloudBase）实现多设备自动云端同步，并集成 DeepSeek 大模型提供智能、温暖的健康建议与个性化分析报告。

## 核心功能

- **快捷/核心记录**：一键记录排便时间、持续时长、布里斯托形状分类（1-7型，配精美拟人化卡通图标）、备注及拍照/相册上传照片。
- **数据分析大盘**：可视化展示排便频次、形状占比、持续时间趋势，支持按周、月、自定义日期段进行筛选过滤。
- **个人中心与云同步**：基于微信自动登录与云开发数据库，无缝实现多端设备数据实时同步与云端备份。
- **DeepSeek 智能健康分析**：通过云函数安全调用 DeepSeek 接口，基于历史数据生成专业的肠道健康分析报告与切实可行的生活饮食建议。

## 技术选型

- **前端框架**：微信小程序原生开发（JavaScript/WXML/WXSS）
- **后端云服务**：微信小程序「云开发（CloudBase/TCB）」
- **云数据库（Cloud Database）**：用于存储用户排便记录及智能健康报告
- **云存储（Cloud Storage）**：用于存储用户拍照上传的排便图像
- **云函数（Cloud Functions）**：用于安全发起 DeepSeek API 鉴权与对话调用，规避密钥泄露风险
- **可视化技术**：微信小程序 Canvas 2D / 纯 WXSS 自定义渲染高兼容性轻量趋势图表

## 架构与目录设计

项目从零构建，核心目录结构规划如下：

```
e:/dump/
├── miniprogram/                    # 小程序前端根目录
│   ├── components/                 # 自定义组件
│   │   ├── bristol-selector/       # 布里斯托大便分类选择器组件
│   │   └── mini-chart/             # 轻量数据可视化图表组件
│   ├── images/                     # 预设布里斯托形状图标及全局切图
│   ├── pages/
│   │   ├── index/                  # 首页：今日概览、快捷记录、最近一次状态
│   │   ├── record/                 # 记录页：时间选择、时长滑块、形状选择、拍照上传、备注
│   │   ├── stats/                  # 统计大盘：数据图表展示、日期段筛选
│   │   ├── analysis/               # 智能分析：DeepSeek 诊断报告、历史报告
│   │   └── mine/                   # 个人中心：用户资料、布里斯托科普、关于
│   ├── app.js                      # 小程序入口，初始化云开发
│   ├── app.json                    # 全局配置，定义 TabBar
│   └── app.wxss                    # 全局莫兰迪配色与圆角卡片样式
├── cloudfunctions/                 # 云开发云函数根目录
│   └── deepseekAnalysis/           # 智能健康报告生成云函数（对接 DeepSeek API）
└── project.config.json             # 小程序项目配置文件
```

## 视觉与交互设计

采用温暖、治愈的莫兰迪低饱和度配色（主色为莫兰迪绿与燕麦奶茶色），通过高质感圆角卡片、柔和阴影和生动有趣的布里斯托卡通图标，为用户提供极其舒适放松的交互氛围。

- **首页与记录页**：极简大按钮交互，使用滑动条调节排便时长，点击直观的布里斯托卡片选取形状。
- **统计大盘**：采用流畅的微渐变线条和柔和的比例环形图，重点数据加粗突出。
- **智能分析页**：打字机式逐步呈现 DeepSeek 报告，营造专业且有温度的私人健康顾问体验。