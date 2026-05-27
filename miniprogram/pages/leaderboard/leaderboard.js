const db = wx.cloud ? wx.cloud.database() : null;

Page({
  data: {
    rangeType: 'all',
    rankList: [],
    myRank: null,
    loading: false
  },

  onLoad() {
    this.fetchLeaderboard();
  },

  onShow() {
    this.fetchLeaderboard();
  },

  onPullDownRefresh() {
    this.fetchLeaderboard();
    wx.stopPullDownRefresh();
  },

  setRange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ rangeType: type });
    this.fetchLeaderboard();
  },

  async fetchLeaderboard() {
    this.setData({ loading: true });

    try {
      if (db) {
        const res = await wx.cloud.callFunction({
          name: 'getLeaderboard',
          data: { rangeType: this.data.rangeType }
        });

        if (res.result && res.result.code === 0) {
          const list = res.result.data || [];
          const app = getApp();
          const myOpenid = app.globalData.openid;
          const localInfo = wx.getStorageSync('local_user_info');

          // 用本地资料补充云排行中当前用户的昵称/头像（云数据可能因未及时同步而缺失）
          if (localInfo && myOpenid) {
            list.forEach(item => {
              if (item.openid && item.openid === myOpenid) {
                if (item.nickName === '匿名拉翔官' && localInfo.nickName) {
                  item.nickName = localInfo.nickName;
                }
                if (!item.avatarUrl || item.avatarUrl.includes('icTdbqWNOwNRna42FI242Lcia07jQodd2UTgVYia8icgZCOfMTNeyFscD6v1ic0Z6WclL8XQX5C7Uu6TOfg')) {
                  if (localInfo.avatarUrl) {
                    item.avatarUrl = localInfo.avatarUrl;
                  }
                }
              }
            });
          }

          let myRank = null;
          list.forEach((item, i) => {
            if (item.openid && myOpenid && item.openid === myOpenid) {
              myRank = { rank: item.rank, count: item.count };
            }
          });

          this.setData({ rankList: list, myRank, loading: false });
          return;
        }
      }

      const records = wx.getStorageSync('local_poop_records') || [];
      const info = wx.getStorageSync('local_user_info');
      const now = new Date();

      let filtered = records;
      if (this.data.rangeType === 'week') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
        filtered = records.filter(r => r.timestamp >= start);
      } else if (this.data.rangeType === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29).getTime();
        filtered = records.filter(r => r.timestamp >= start);
      }

      const displayName = (info && info.nickName) ? info.nickName : '匿名拉翔官';
      const displayAvatar = (info && info.avatarUrl) ? info.avatarUrl :
        'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2UTgVYia8icgZCOfMTNeyFscD6v1ic0Z6WclL8XQX5C7Uu6TOfg/0';

      this.setData({
        rankList: [{
          rank: 1,
          count: filtered.length,
          nickName: displayName,
          avatarUrl: displayAvatar
        }],
        myRank: { rank: 1, count: filtered.length },
        loading: false
      });

    } catch (err) {
      console.error('获取排行榜失败', err);
      this.setData({ loading: false });
      wx.showToast({ title: '获取排行榜失败', icon: 'none' });
    }
  }
});
