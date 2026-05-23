// pages/stats/stats.js
const db = wx.cloud ? wx.cloud.database() : null;

Page({
  data: {
    rangeType: '7', // '7' | '30' | 'custom'
    startDate: '',
    endDate: '',
    maxDate: '',
    totalCount: 0,
    avgDuration: 0,
    healthyRatio: 0,
    trendData: [], // 每日统计次数趋势数据
    typeDistribution: [], // 形状占比分布
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
    
    // 初始化自定义日期的起止时间为过去7天
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

  // 切换筛选跨度
  setRange(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ rangeType: type });
    this.loadStats();
  },

  // 自定义日期改变
  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
    this.loadStats();
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
    this.loadStats();
  },

  // 获取汇总与统计计算
  async loadStats() {
    let records = [];

    // 1. 确定起止时间戳
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

    // 2. 拉取数据
    if (db) {
      wx.showNavigationBarLoading();
      try {
        const _ = db.command;
        const res = await db.collection('poop_records')
          .where({
            timestamp: _.gte(startTs).and(_.lte(endTs))
          })
          .limit(100)
          .get();
        records = res.data;
        wx.hideNavigationBarLoading();
      } catch (err) {
        wx.hideNavigationBarLoading();
        console.error('获取统计数据失败，尝试本地降级', err);
        records = this.getLocalRecordsFiltered(startTs, endTs);
      }
    } else {
      records = this.getLocalRecordsFiltered(startTs, endTs);
    }

    this.processRecords(records, startTs, endTs);
  },

  getLocalRecordsFiltered(startTs, endTs) {
    const list = wx.getStorageSync('local_poop_records') || [];
    return list.filter(item => item.timestamp >= startTs && item.timestamp <= endTs);
  },

  // 处理排便数据并进行多维度图表换算
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

    // 1. 基本汇总数据计算
    let totalDuration = 0;
    let healthyCount = 0; // 3型和4型属于健康的排便状态
    records.forEach(r => {
      totalDuration += r.duration || 0;
      if (r.bristolType === 3 || r.bristolType === 4) {
        healthyCount++;
      }
    });

    const avgDuration = Math.round(totalDuration / count);
    const healthyRatio = Math.round((healthyCount / count) * 100);

    // 2. 排便频次趋势（按日期聚合，智能补齐区间缺失日期）
    const dayMs = 24 * 60 * 60 * 1000;
    const dateMap = {};
    
    // 初始化区间内的每一天，保证柱状图即使在没记录的日子也能展现空位
    for (let ts = startTs; ts <= endTs; ts += dayMs) {
      const d = new Date(ts);
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      const fullKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dateMap[fullKey] = { label, count: 0 };
    }

    // 填充实际记录频次
    records.forEach(r => {
      if (dateMap[r.date]) {
        dateMap[r.date].count++;
      }
    });

    // 转换成列表并排序
    const trendList = Object.keys(dateMap).map(key => ({
      dateStr: key,
      label: dateMap[key].label,
      count: dateMap[key].count
    })).sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    // 获取最高记录次数，用于柱状图按百分比定高，保持界面美观
    let maxCount = 1;
    trendList.forEach(t => {
      if (t.count > maxCount) maxCount = t.count;
    });

    const trendData = trendList.map(t => ({
      label: t.label,
      count: t.count,
      heightPct: Math.round((t.count / maxCount) * 85) // 最高高度控制在 85%，防溢出
    }));

    // 3. 形状分布比例（1-7型）
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
    }).sort((a, b) => b.count - a.count); // 优先展示次数多的类型，直观对比

    this.setData({
      totalCount: count,
      avgDuration,
      healthyRatio,
      trendData,
      typeDistribution
    });
  }
});