# 微信小程序版本使用指南

## 文件结构

```
miniprogram/
├── app.js              # 小程序入口
├── app.json            # 小程序配置
├── app.wxss            # 全局样式
├── sitemap.json        # 搜索配置
├── project.config.json # 项目配置（需填入你的 AppID）
└── pages/
    └── index/
        ├── index.js    # 页面逻辑
        ├── index.wxml  # 页面结构（web-view）
        ├── index.wxss  # 页面样式
        └── index.json  # 页面配置
```

## 使用步骤

### 第一步：注册微信小程序账号

1. 访问 https://mp.weixin.qq.com/
2. 点击"立即注册" → 选择"小程序"
3. 用邮箱注册，完成验证
4. 在小程序管理后台 → "开发" → "开发管理" → "开发设置" 中获取 **AppID**

### 第二步：下载微信开发者工具

1. 访问 https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
2. 下载 macOS 版本并安装

### 第三步：导入小程序项目

1. 打开微信开发者工具
2. 选择"导入项目"
3. 项目目录选择：`vocab-master/miniprogram`
4. AppID 填入你注册获取的 AppID（或选择"测试号"）
5. 点击"导入"

### 第四步：开发调试

#### 本地开发（用 localhost）

1. 先在电脑上启动 Web 应用：
   ```bash
   cd vocab-master
   npm run dev
   ```
2. 在微信开发者工具中：
   - 点击右上角"详情" → "本地设置"
   - ✅ 勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
3. 小程序会加载 `http://localhost:5173/`（在 app.js 中配置）

#### 修改 Web 应用地址

编辑 `miniprogram/app.js`，修改 `webUrl`：

```js
// 开发环境（本地）
webUrl: 'http://localhost:5173'

// 生产环境（部署后）
webUrl: 'https://your-domain.com'
```

### 第五步：发布上线

web-view 方案上线需要：

1. **域名备案**：你的域名需要完成 ICP 备案
2. **HTTPS**：必须使用 HTTPS
3. **配置业务域名**：
   - 在小程序管理后台 → "开发" → "开发管理" → "开发设置" → "业务域名"
   - 添加你的域名（如 `https://your-domain.com`）
   - 下载校验文件放到域名根目录
4. **部署 Web 应用**：将 vocab-master 项目部署到你的服务器
5. **提交审核**：在开发者工具中上传代码，然后在管理后台提交审核

## 注意事项

- web-view 组件会全屏显示网页内容
- 网页需要做移动端适配（已处理：768px 以下切换为底部导航栏布局）
- 个人小程序也可以使用 web-view，但需要配置业务域名
- 小程序 web-view 中的 alert/confirm 可能不生效，建议用其他方式提示
