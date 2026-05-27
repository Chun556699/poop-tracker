App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloudbase-d3gwn3a4852809aa4',
        traceUser: true,
      });
    }

    this.globalData = {
      openid: '',
      themeColor: '#8FAF9F',
      secondaryColor: '#D9C3B0'
    };

    if (wx.cloud) {
      setTimeout(() => {
        this.fetchOpenid();
      }, 500);
    }
  },

  fetchOpenid() {
    try {
      wx.cloud.callFunction({
        name: 'getOpenid',
        success: (res) => {
          if (res && res.result) {
            this.globalData.openid = res.result.openid || '';
            if (this.globalData.openid) {
              this.loadProfileFromCloud();
            }
          }
        },
        fail: (err) => {
          console.warn('getOpenid 云函数未部署或调用失败，使用本地模式运行', err.errMsg || '');
          this.globalData.openid = '';
        }
      });
    } catch (e) {
      console.warn('云函数调用异常，使用本地模式运行');
      this.globalData.openid = '';
    }
  },

  loadProfileFromCloud() {
    const openid = this.globalData.openid;
    if (!openid) return;

    const db = wx.cloud.database();
    db.collection('user_profiles')
      .where({ _openid: openid })
      .get()
      .then(res => {
        if (res.data.length > 0) {
          const p = res.data[0];
          wx.setStorageSync('local_user_info', {
            avatarUrl: p.avatarUrl,
            nickName: p.nickName
          });
        }
      })
      .catch(err => {
        console.warn('加载云端个人资料失败，使用本地缓存', err.errMsg || '');
      });
  }
});
