// app.js
App({
  onLaunch: function () {
    // 小程序启动时执行
    console.log('单词背诵大师小程序启动');
  },
  globalData: {
    // 开发环境：本地地址；生产环境：替换为你的 HTTPS 域名
    // 例如：https://your-domain.com
    webUrl: 'http://localhost:5173'
  }
});
