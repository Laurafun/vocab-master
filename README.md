# 单词背诵大师 (Vocab Master)

基于艾宾浩斯记忆曲线的智能单词背诵应用，使用 CodeBuddy Agent SDK 构建。

## 功能特性

### 1. 智能复习系统
- 基于艾宾浩斯遗忘曲线和 Leitner System 的间隔重复算法
- 7 个记忆盒子，复习间隔：20分钟 → 1天 → 2天 → 4天 → 7天 → 15天 → 30天
- 答对自动升级，答错自动降级并当天重练
- 自动安排每日复习计划

### 2. 单词管理
- 添加单个单词（支持音标、释义、例句、标签）
- 批量导入（支持 `单词|释义`、`单词:释义`、`单词 释义` 格式）
- 编辑、删除、搜索单词
- 查看每个单词的复习状态和统计

### 3. 背单词界面
- 卡片翻转设计（先看单词，再翻看释义）
- 内置发音功能（Web Speech API）
- "记得"/"不记得" 按钮
- 错题自动重练
- 实时进度条和统计

### 4. 学习仪表盘
- 总单词数、待复习、已掌握、连续学习天数
- 今日学习进度（已复习/正确/错误/正确率）
- 艾宾浩斯遗忘曲线图
- 间隔重复效果柱状图
- 单词掌握分布图

### 5. AI 单词学习助手
- 集成 CodeBuddy Agent SDK
- AI 辅助：单词解释、同义词辨析、造句、词根词缀分析
- SSE 流式响应

### 6. 设置
- 每日单词数可调（10-60 个）
- 显示音标/例句/自动发音开关
- CodeBuddy API Key 配置
- 深色/浅色主题切换

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Express + SQLite (better-sqlite3) + CodeBuddy Agent SDK |
| 前端 | React 18 + Vite 5 + TypeScript + TDesign React + Tailwind CSS |
| 桌面 | Electron |
| 路由 | HashRouter (兼容浏览器和 Electron) |
| 图表 | SVG 自定义实现 |

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装

```bash
cd vocab-master
npm install
cp .env.example .env
```

### 配置 AI 助手（可选）

编辑 `.env` 文件，添加 CodeBuddy API Key：
```
CODEBUDDY_API_KEY=your_api_key_here
```
获取 API Key: https://www.codebuddy.cn

### 浏览器开发模式

```bash
npm run dev
```
- 前端: http://localhost:5173
- 后端: http://localhost:3000

### Electron 桌面模式

```bash
# 先安装 electron
npm install --save-dev electron wait-on

# 启动桌面应用
npm run dev:electron
```

### 构建

```bash
# 构建前端
npm run build

# 打包桌面应用
npm run build:electron
```

## 使用指南

1. **添加单词**：进入"单词库"页面，点击"添加单词"或"批量导入"
2. **开始背诵**：进入"背单词"页面，系统自动安排今日单词
3. **查看进度**：进入"仪表盘"查看学习统计和记忆曲线
4. **AI 辅助**：进入"AI 助手"询问单词相关问题
5. **设置**：在"设置"页面调整每日单词数和其他选项

## 记忆曲线原理

艾宾浩斯遗忘曲线描述了记忆随时间衰减的规律。通过在关键时间点进行复习，可以有效巩固记忆：

| 复习次数 | 间隔时间 | 记忆保持率 |
|---------|---------|-----------|
| 第1次 | 20分钟后 | ~58% |
| 第2次 | 1天后 | ~70% |
| 第3次 | 2天后 | ~80% |
| 第4次 | 4天后 | ~86% |
| 第5次 | 7天后 | ~90% |
| 第6次 | 15天后 | ~95% |
| 第7次 | 30天后 | ~98% |

## License

MIT
