const db = wx.cloud ? wx.cloud.database() : null;
const timer = require('../../utils/timer');

Page({
  data: {
    greeting: '你好！今天肠胃感觉如何？',
    todayCount: 0,
    averageDuration: 0,
    lastRecord: null,
    recentRecords: [],
    hasLoaded: false,
    bristolNames: {
      1: { emoji: '🌰', text: '1型：散状硬球 (严重便秘)' },
      2: { emoji: '🪵', text: '2型：凹凸腊肠 (轻微便秘)' },
      3: { emoji: '🥖', text: '3型：裂纹腊肠 (稍微干燥)' },
      4: { emoji: '🍌', text: '4型：光滑香蕉 (完美健康)' },
      5: { emoji: '🍞', text: '5型：软质断块 (纤维偏少)' },
      6: { emoji: '🥣', text: '6型：糊状泥状 (轻微腹泻)' },
      7: { emoji: '💧', text: '7型：水样无固体 (严重腹泻)' }
    },
    timerRunning: false,
    timerDisplay: '00:00:00'
  },

  onLoad() {
    this.updateGreeting();
    this.resumeTimerIfRunning();
  },

  onShow() {
    this.fetchHomeData();
    this.resumeTimerIfRunning();
  },

  onHide() {
    this.stopTimerTick();
  },

  onUnload() {
    this.stopTimerTick();
  },

  onPullDownRefresh() {
    this.fetchHomeData();
    wx.stopPullDownRefresh();
  },

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

  fetchHomeData() {
    const app = getApp();
    const openid = app.globalData.openid;

    if (!db || !openid) {
      this.fetchFromLocalCache(openid);
      return;
    }

    wx.showNavigationBarLoading();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

    const _ = db.command;

    db.collection('poop_records')
      .where({
        _openid: openid,
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
        if (err.errMsg && (err.errMsg.includes('not exist') || err.errMsg.includes('-502005'))) {
          console.warn('poop_records 集合不存在，自动降级本地缓存');
          this.fetchFromLocalCache(openid);
        }
      });

    db.collection('poop_records')
      .where({ _openid: openid })
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
        if (err.errMsg && (err.errMsg.includes('not exist') || err.errMsg.includes('-502005'))) {
          this.fetchFromLocalCache(openid);
        }
      });
  },

  fetchFromLocalCache(openid) {
    const list = (wx.getStorageSync('local_poop_records') || [])
      .filter(item => !openid || item._openid === openid);
    list.sort((a, b) => b.timestamp - a.timestamp);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

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

  navToRecord() {
    var url = '/pages/record/record';
    if (timer.isRunning()) {
      var durationMinutes = timer.getDurationMinutes();
      timer.stop();
      this.stopTimerTick();
      this.setData({ timerRunning: false, timerDisplay: '00:00:00' });
      url += '?timerDuration=' + durationMinutes;
    }
    wx.navigateTo({
      url: url
    });
  },

  editRecord(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/record/record?id=${id}`
    });
  },

  resumeTimerIfRunning() {
    if (!timer.isRunning()) return;
    var elapsed = timer.getElapsedSeconds();
    this.setData({
      timerRunning: true,
      timerDisplay: timer.formatTime(elapsed)
    });
    this.startTimerTick();
  },

  startTimerTick() {
    if (this._timerInterval) clearInterval(this._timerInterval);
    this._timerInterval = setInterval(function () {
      if (!timer.isRunning()) {
        this.stopTimerTick();
        this.setData({ timerRunning: false, timerDisplay: '00:00:00' });
        return;
      }
      var elapsed = timer.getElapsedSeconds();
      this.setData({ timerDisplay: timer.formatTime(elapsed) });
    }.bind(this), 1000);
  },

  stopTimerTick() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },

  onTimerTap() {
    if (this.data.timerRunning) {
      this.stopTimerAndNavigate();
    } else {
      this.startTimer();
    }
  },

  startTimer() {
    timer.start();
    this.setData({ timerRunning: true, timerDisplay: '00:00:00' });
    this.startTimerTick();
    wx.showToast({ title: '计时已开始', icon: 'none', duration: 1000 });
  },

  stopTimerAndNavigate() {
    var durationMinutes = timer.getDurationMinutes();
    timer.stop();
    this.stopTimerTick();
    this.setData({ timerRunning: false, timerDisplay: '00:00:00' });
    wx.navigateTo({
      url: '/pages/record/record?timerDuration=' + durationMinutes
    });
  }
});
