// index.js
const app = getApp();

Page({
  data: {
    webUrl: ''
  },

  onLoad: function () {
    // 从全局配置获取 URL
    this.setData({
      webUrl: app.globalData.webUrl
    });
  }
});
