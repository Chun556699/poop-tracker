// app.js
App({
  onLaunch: function () {
    // 检查云开发环境初始化
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        // env 参数决定后续 API 调用的默认云环境
        // 留空则默认使用首个创建的云环境
        env: '', 
        traceUser: true,
      });
    }

    this.globalData = {
      // 莫兰迪全局配色，可在页面组件中获取调用
      themeColor: '#8FAF9F',
      secondaryColor: '#D9C3B0'
    };
  }
});