// pages/index/index.js
const db = wx.cloud ? wx.cloud.database() : null;

Page({
  data: {
    greeting: '你好！今天肠胃感觉如何？',
    todayCount: 0,
    averageDuration: 0,
    lastRecord: null,
    recentRecords: [], // 最近3次记录列表
    hasLoaded: false,
    bristolNames: {
      1: { emoji: '🌰', text: '1型：散状硬球 (严重便秘)' },
      2: { emoji: '🪵', text: '2型：凹凸腊肠 (轻微便秘)' },
      3: { emoji: '🥖', text: '3型：裂纹腊肠 (稍微干燥)' },
      4: { emoji: '🍌', text: '4型：光滑香蕉 (完美健康)' },
      5: { emoji: '🍞', text: '5型：软质断块 (纤维偏少)' },
      6: { emoji: '🥣', text: '6型：糊状泥状 (轻微腹泻)' },
      7: { emoji: '💧', text: '7型：水样无固体 (严重腹泻)' }
    }
  },

  onLoad() {
    this.updateGreeting();
  },

  onShow() {
    this.fetchHomeData();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.fetchHomeData();
    wx.stopPullDownRefresh();
  },

  // 动态更新问候语（根据24小时制）
  updateGreeting() {
    const hour = new Date().getHours();
    let greeting = '你好！今天肠胃状况如何？';
    if (hour >= 5 && hour < 9) {
      greeting = '早上好！清晨一杯温开水，有助于唤醒肠道动力 ☕';
    } else if (hour >= 9 && hour < 12) {
      greeting = '上午好！忙碌之余记得多喝水，多活动活动 🏃';
    } else if (hour >= 12 && hour < 14) {
      greeting = '中午好！午餐多吃富含膳食纤维的食物哦 🍲';
    } else if (hour >= 14 && hour < 18) {
      greeting = '下午好！适当吃点水果，补充维生素与果胶 🍎';
    } else if (hour >= 18 && hour < 23) {
      greeting = '晚上好！今天排便了吗？睡前坚持记录更健康 🌛';
    } else {
      greeting = '深夜了！肠胃也需要休息，早点休息吧 💤';
    }
    this.setData({ greeting });
  },

  // 获取主页所需统计和记录列表
  fetchHomeData() {
    if (!db) {
      this.fetchFromLocalCache();
      return;
    }

    wx.showNavigationBarLoading();

    // 获取今天0时和24时的毫秒数
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

    const _ = db.command;

    // 1. 查询今天的记录数量与计算平均时长
    db.collection('poop_records')
      .where({
        timestamp: _.gte(startOfToday).and(_.lte(endOfToday))
      })
      .get()
      .then(res => {
        const list = res.data;
        const count = list.length;
        let totalDuration = 0;
        list.forEach(item => {
          totalDuration += item.duration || 0;
        });
        const avg = count > 0 ? Math.round(totalDuration / count) : 0;

        this.setData({
          todayCount: count,
          averageDuration: avg
        });
      })
      .catch(err => {
        console.error('获取今日记录失败', err);
      });

    // 2. 查询最近3次记录
    db.collection('poop_records')
      .orderBy('timestamp', 'desc')
      .limit(3)
      .get()
      .then(res => {
        wx.hideNavigationBarLoading();
        const records = res.data;
        this.setData({
          recentRecords: records,
          lastRecord: records[0] || null,
          hasLoaded: true
        });
      })
      .catch(err => {
        wx.hideNavigationBarLoading();
        this.setData({ hasLoaded: true });
        console.error('获取最近记录失败', err);
      });
  },

  // 纯本地缓存的降级数据加载（支持完全无网调试）
  fetchFromLocalCache() {
    const list = wx.getStorageSync('local_poop_records') || [];
    // 按时间戳降序
    list.sort((a, b) => b.timestamp - a.timestamp);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

    // 筛选今天
    const todayList = list.filter(item => item.timestamp >= startOfToday && item.timestamp <= endOfToday);
    const count = todayList.length;
    let totalDuration = 0;
    todayList.forEach(item => {
      totalDuration += item.duration || 0;
    });
    const avg = count > 0 ? Math.round(totalDuration / count) : 0;

    this.setData({
      todayCount: count,
      averageDuration: avg,
      recentRecords: list.slice(0, 3),
      lastRecord: list[0] || null,
      hasLoaded: true
    });
  },

  // 跳转记录页
  navToRecord() {
    wx.navigateTo({
      url: '/pages/record/record'
    });
  },

  // 点击历史卡片跳转编辑
  editRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/record/record?id=${id}`
    });
  }
});