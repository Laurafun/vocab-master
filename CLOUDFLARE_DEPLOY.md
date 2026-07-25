# Cloudflare Pages 部署指南

## 为什么用 Cloudflare Pages？

- ✅ 国内访问速度快（有国内 CDN 节点）
- ✅ 完全免费（无限带宽 + 无限请求）
- ✅ 自动 HTTPS
- ✅ 直接集成 GitHub，推送代码自动部署

## 部署步骤（5 分钟）

### 第 1 步：注册 Cloudflare 账号（1 分钟）

1. 打开 https://dash.cloudflare.com/sign-up
2. 用邮箱注册（可以用 657258975@qq.com）
3. 选 "Free" 免费计划

### 第 2 步：创建 Pages 项目（2 分钟）

1. 登录后，左侧菜单点 **"Workers & Pages"**
2. 点 **"Create application"** → **"Pages"** 标签 → **"Connect to Git"**
3. 授权 GitHub：
   - 选 **"Only select repositories"**
   - 勾选 `Laurafun/vocab-master`
   - 点 "Install & Authorize"
4. 选择 `vocab-master` 仓库 → 点 **"Begin setup"**

### 第 3 步：配置项目

| 字段 | 填写 |
|------|------|
| **Project name** | `vocab-master` |
| **Production branch** | `main` |
| **Framework preset** | 选 `Vite` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |

### 第 4 步：配置环境变量

展开 **"Environment variables"**，添加两个：

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://uowcxcoxqbnxyghit.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_WmN4C_DCLoU14NHI1wd1GA_FNMbjO3c` |

### 第 5 步：部署

1. 点 **"Save and Deploy"**
2. 等 1-2 分钟构建完成
3. 得到网址：`https://vocab-master.pages.dev`

**这个网址国内访问速度飞快！** 🚀

---

## 给学生使用

- 把 `https://vocab-master.pages.dev` 发到班级群
- 或用 https://cli.im 生成二维码
- 学生扫码或点击链接即可使用
