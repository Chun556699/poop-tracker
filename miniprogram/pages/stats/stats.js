const db = wx.cloud ? wx.cloud.database() : null;

Page({
  _allRecords: [],

  data: {
    rangeType: '7',
    startDate: '',
    endDate: '',
    maxDate: '',
    totalCount: 0,
    avgDuration: 0,
    healthyRatio: 0,
    trendData: [],
    typeDistribution: [],
    currentYear: 0,
    currentMonth: 0,
    calendarDays: [],
    bristolMeta: {
      1: { name: '1型 散状硬球', emoji: '🌰', color: '#C6A18D' },
      2: { name: '2型 凹凸腊肠', emoji: '🪵', color: '#B58D70' },
      3: { name: '3型 裂纹腊肠', emoji: '🥖', color: '#D4B295' },
      4: { name: '4型 光滑香蕉', emoji: '🍌', color: '#8FAF9F' },
      5: { name: '5型 软质断块', emoji: '🍞', color: '#D4C0A8' },
      6: { name: '6型 糊状泥状', emoji: '🥣', color: '#E8A08A' },
      7: { name: '7型 水样无固体', emoji: '💧', color: '#D07A70' }
    }
  },

  onLoad() {
    const now = new Date();
    const todayStr = this.formatDate(now);
    const sevenDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    this.setData({
      endDate: todayStr,
      startDate: this.formatDate(sevenDaysAgo),
      maxDate: todayStr
    });
  },

  onShow() {
    this.loadStats();
  },

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  setRange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ rangeType: type });
    this.loadStats();
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
    this.loadStats();
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
    this.loadStats();
  },

  async loadStats() {
    const app = getApp();
    const openid = app.globalData.openid;

    let records = [];
    let startTs = 0;
    let endTs = Date.now();
    const now = new Date();

    if (this.data.rangeType === '7') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      startTs = start.getTime();
    } else if (this.data.rangeType === '30') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
      startTs = start.getTime();
    } else {
      const start = new Date(`${this.data.startDate}T00:00:00`);
      const end = new Date(`${this.data.endDate}T23:59:59`);
      startTs = start.getTime();
      endTs = end.getTime();
    }

    if (db && openid) {
      wx.showNavigationBarLoading();
      try {
        const _ = db.command;
        const res = await db.collection('poop_records')
          .where({
            _openid: openid,
            timestamp: _.gte(startTs).and(_.lte(endTs))
          })
          .limit(100)
          .get();
        records = res.data;
        wx.hideNavigationBarLoading();
      } catch (err) {
        wx.hideNavigationBarLoading();
        console.error('获取统计数据失败，尝试本地降级', err);
        records = this.getLocalRecordsFiltered(startTs, endTs, openid);
      }
    } else {
      records = this.getLocalRecordsFiltered(startTs, endTs, openid);
    }

    this._allRecords = records;
    this.processRecords(records, startTs, endTs);

    if (!this.data.currentYear) {
      const nowDate = new Date();
      this.generateCalendar(nowDate.getFullYear(), nowDate.getMonth() + 1);
    } else {
      this.generateCalendar(this.data.currentYear, this.data.currentMonth);
    }
  },

  getLocalRecordsFiltered(startTs, endTs, openid) {
    const list = (wx.getStorageSync('local_poop_records') || [])
      .filter(item => !openid || item._openid === openid);
    return list.filter(item => item.timestamp >= startTs && item.timestamp <= endTs);
  },

  processRecords(records, startTs, endTs) {
    const count = records.length;
    if (count === 0) {
      this.setData({
        totalCount: 0,
        avgDuration: 0,
        healthyRatio: 0,
        trendData: [],
        typeDistribution: []
      });
      return;
    }

    let totalDuration = 0;
    let healthyCount = 0;
    records.forEach(r => {
      totalDuration += r.duration || 0;
      if (r.bristolType === 3 || r.bristolType === 4) {
        healthyCount++;
      }
    });

    const avgDuration = Math.round(totalDuration / count);
    const healthyRatio = Math.round((healthyCount / count) * 100);

    const dayMs = 24 * 60 * 60 * 1000;
    const dateMap = {};

    for (let ts = startTs; ts <= endTs; ts += dayMs) {
      const d = new Date(ts);
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      const fullKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dateMap[fullKey] = { label, count: 0 };
    }

    records.forEach(r => {
      if (dateMap[r.date]) {
        dateMap[r.date].count++;
      }
    });

    const trendList = Object.keys(dateMap).map(key => ({
      dateStr: key,
      label: dateMap[key].label,
      count: dateMap[key].count
    })).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    let maxCount = 1;
    trendList.forEach(t => {
      if (t.count > maxCount) maxCount = t.count;
    });

    const trendData = trendList.map(t => ({
      label: t.label,
      count: t.count,
      heightPct: Math.round((t.count / maxCount) * 85)
    }));

    const typeCountMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
    records.forEach(r => {
      if (typeCountMap[r.bristolType] !== undefined) {
        typeCountMap[r.bristolType]++;
      }
    });

    const typeDistribution = Object.keys(typeCountMap).map(typeKey => {
      const t = parseInt(typeKey, 10);
      const meta = this.data.bristolMeta[t];
      const tCount = typeCountMap[t];
      return {
        type: t,
        name: meta.name,
        emoji: meta.emoji,
        color: meta.color,
        count: tCount,
        pct: count > 0 ? Math.round((tCount / count) * 100) : 0
      };
    }).sort((a, b) => b.count - a.count);

    this.setData({
      totalCount: count,
      avgDuration,
      healthyRatio,
      trendData,
      typeDistribution
    });
  },

  generateCalendar(year, month) {
    const list = (this._allRecords && this._allRecords.length > 0)
      ? this._allRecords
      : (wx.getStorageSync('local_poop_records') || []);

    const firstDay = new Date(year, month - 1, 1).getDay();
    const totalDays = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push({ isPlaceholder: true });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayRecords = list.filter(item => item.date === dateStr);

      let mainEmoji = '';
      if (dayRecords.length > 0) {
        const counts = {};
        dayRecords.forEach(r => {
          counts[r.bristolType] = (counts[r.bristolType] || 0) + 1;
        });
        let maxCount = 0;
        let bestType = 4;
        for (const type in counts) {
          if (counts[type] > maxCount) {
            maxCount = counts[type];
            bestType = parseInt(type, 10);
          }
        }
        const emojiMap = { 1: '🌰', 2: '🪵', 3: '🥖', 4: '🍌', 5: '🍞', 6: '🥣', 7: '💧' };
        mainEmoji = emojiMap[bestType] || '💩';
      }

      const todayObj = new Date();
      const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, '0')}-${String(todayObj.getDate()).padStart(2, '0')}`;

      days.push({
        day: d,
        dateStr,
        hasRecords: dayRecords.length > 0,
        recordsCount: dayRecords.length,
        emoji: mainEmoji,
        isToday: dateStr === todayStr
      });
    }

    this.setData({
      currentYear: year,
      currentMonth: month,
      calendarDays: days
    });
  },

  prevMonth() {
    let y = this.data.currentYear;
    let m = this.data.currentMonth - 1;
    if (m < 1) { m = 12; y--; }
    this.generateCalendar(y, m);
  },

  nextMonth() {
    let y = this.data.currentYear;
    let m = this.data.currentMonth + 1;
    if (m > 12) { m = 1; y++; }
    this.generateCalendar(y, m);
  },

  tapCalendarDay(e) {
    const dayObj = e.currentTarget.dataset.day;
    if (!dayObj || dayObj.isPlaceholder) return;

    if (dayObj.hasRecords) {
      wx.showModal({
        title: `${dayObj.dateStr} 记录`,
        content: `当天共排便 ${dayObj.recordsCount} 次，优势性状：${dayObj.emoji}。`,
        showCancel: false,
        confirmColor: '#8FAF9F'
      });
    } else {
      wx.showToast({
        title: `${dayObj.dateStr}：暂无排便记录 💤`,
        icon: 'none'
      });
    }
  }
});
