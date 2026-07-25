# 部署指南 - 让学生免费使用单词背诵大师

## 总览

```
学生手机浏览器 → Vercel（免费托管前端）→ Supabase（免费云数据库）
```

完全免费，支持 120 人同时使用，自动 HTTPS。

---

## 第一步：注册 Supabase（2分钟）

1. 打开 https://supabase.com → 点 "Start your project"
2. 用 GitHub 账号登录（没有就注册一个）
3. 点 "New Project" 创建项目
4. 填写：
   - Name: `vocab-master`
   - Database Password: 设一个密码（记下来）
   - Region: 选离你最近的（如 Southeast Asia）
5. 点 "Create new project"，等待 1-2 分钟创建完成

### 获取密钥

1. 在项目左侧菜单点 **"Settings"** → **"API"**
2. 找到以下两个值，复制保存：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOi...`（很长的一串）

### 创建数据库表

1. 在左侧菜单点 **"SQL Editor"**
2. 点 "New query"
3. 把项目目录下 `supabase-schema.sql` 文件的**全部内容**复制粘贴进去
4. 点 "Run" 执行
5. 看到成功消息后，20 个示例单词就自动导入好了

---

## 第二步：注册 Vercel（2分钟）

1. 打开 https://vercel.com → 用 GitHub 账号登录
2. 点 "Add New" → "Project"
3. 导入你的 GitHub 仓库（需要先把代码推到 GitHub）

> 如果还没有 GitHub 仓库，在项目目录执行：
> ```bash
> git init
> git add .
> git commit -m "vocab master"
> ```
> 然后在 GitHub 新建仓库并推送。

### 配置环境变量

在 Vercel 项目设置的 "Environment Variables" 中添加：

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | 你的 Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | 你的 Supabase anon key |

### 部署

1. 点 "Deploy"
2. 等待 1-2 分钟构建完成
3. 获得一个网址，如 `https://vocab-master-xxx.vercel.app`
4. **这个网址就是给学生用的链接！**

---

## 第三步：给学生使用

### 方式 1：直接发链接
- 把 Vercel 的网址发到班级群
- 学生手机浏览器打开就能用
- 第一次打开输入姓名 → 开始背单词

### 方式 2：生成二维码
- 用 https://cli.im 等工具把网址生成二维码
- 学生扫码打开

### 方式 3：微信小程序（可选）
- 用之前的 miniprogram 代码
- 把 `app.js` 里的 `webUrl` 改成 Vercel 网址
- 配置业务域名后提交审核

---

## 管理生词本

### 添加单词（老师操作）
1. 打开网址 → 输入你的名字登录
2. 进入"单词库" → 点"批量导入"
3. 粘贴单词列表（格式：`单词|释义`，每行一个）
4. 所 有学生会自动看到新单词

### 学生数据
- 每个学生有独立的复习进度
- 在 Supabase Dashboard → Table Editor 可以查看所有数据
- `students` 表 = 学生名单
- `student_words` 表 = 每人的记忆状态
- `review_records` 表 = 复习记录

---

## 费用说明

| 服务 | 免费额度 | 120人够用吗 |
|------|---------|------------|
| Supabase | 500MB 数据库 + 5万月活用户 | ✅ 够用 |
| Vercel | 100GB 带宽/月 | ✅ 够用 |
| 总费用 | ¥0 | 永久免费 |

> 如果学生超过 500 人或数据超过 500MB，才需要升级付费计划。

---

## 常见问题

**Q: 学生打开是白屏？**
A: 检查 Vercel 环境变量是否配置正确（VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY）

**Q: 学生看不到单词？**
A: 检查 Supabase SQL 是否执行成功，在 Table Editor 里看 words 表有没有数据

**Q: 两个学生同名怎么办？**
A: 系统会认为是同一个账号，建议让学生用"姓名+学号"格式登录

**Q: 数据会丢失吗？**
A: 不会，数据存在 Supabase 云端，永久保存
