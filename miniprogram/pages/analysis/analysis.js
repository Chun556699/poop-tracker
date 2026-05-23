// pages/analysis/analysis.js
const db = wx.cloud ? wx.cloud.database() : null;

Page({
  data: {
    isGenerating: false,
    loadingTip: 'AI 肠道家庭医生正在仔细研读您的记录...',
    recordsCount: 0,
    currentReport: null, // 当前阅读的报告详情
    historyReports: [], // 历史报告归档列表
    hasLoaded: false
  },

  onShow() {
    this.loadHistoryReports();
    this.checkRecordsCount();
  },

  // 检测过去 7 天内的样本数，确保有数可析
  checkRecordsCount() {
    const startTs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (db) {
      const _ = db.command;
      db.collection('poop_records')
        .where({ timestamp: _.gte(startTs) })
        .count()
        .then(res => {
          this.setData({ recordsCount: res.total });
        });
    } else {
      const list = wx.getStorageSync('local_poop_records') || [];
      const count = list.filter(item => item.timestamp >= startTs).length;
      this.setData({ recordsCount: count });
    }
  },

  // 获取历史健康评估报告存档
  loadHistoryReports() {
    if (!db) {
      const history = wx.getStorageSync('local_health_reports') || [];
      history.sort((a, b) => b.timestamp - a.timestamp);
      const formatted = history.map(item => {
        const date = new Date(item.timestamp);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        return {
          id: item.id,
          dateStr,
          dateRange: item.dateRange,
          sections: this.parseMarkdown(item.reportText)
        };
      });
      this.setData({
        historyReports: formatted,
        hasLoaded: true
      });
      return;
    }

    wx.showNavigationBarLoading();
    db.collection('health_reports')
      .orderBy('createdAt', 'desc')
      .get()
      .then(res => {
        wx.hideNavigationBarLoading();
        const list = res.data.map(item => {
          const date = new Date(item.createdAt);
          const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          return {
            _id: item._id,
            dateStr,
            dateRange: item.dateRange,
            sections: this.parseMarkdown(item.reportText)
          };
        });

        this.setData({
          historyReports: list,
          hasLoaded: true
        });
      })
      .catch(err => {
        wx.hideNavigationBarLoading();
        this.setData({ hasLoaded: true });
        console.error('获取历史报告失败', err);
      });
  },

  // 自研轻量级 Markdown 解析算法，用于精美地卡片渲染 WXML
  parseMarkdown(text) {
    const sections = [];
    const parts = text.split('###');
    parts.forEach(part => {
      const trimmed = part.trim();
      if (!trimmed) return;
      const lines = trimmed.split('\n');
      const title = lines[0].trim();
      const contentLines = lines.slice(1).map(l => {
        let lTrim = l.trim();
        let isListItem = false;
        let isMuted = false;
        
        if (lTrim.startsWith('-') || lTrim.startsWith('*')) {
          lTrim = lTrim.replace(/^[\-\*]\s*/, '');
          isListItem = true;
        } else if (lTrim.startsWith('>') || lTrim.startsWith('_') || lTrim.startsWith('*')) {
          lTrim = lTrim.replace(/^[\>\_]\s*/, '').replace(/[\_\*]/g, '');
          isMuted = true;
        }

        // 剥离并呈现 Markdown 粗体样式
        lTrim = lTrim.replace(/\*\*(.*?)\*\*/g, '$1');

        return { text: lTrim, isListItem, isMuted };
      }).filter(l => l.text.length > 0);

      sections.push({ title, contentLines });
    });
    return sections;
  },

  // 一键唤醒 DeepSeek 分析生成流程
  async generateReport() {
    if (this.data.isGenerating) return;
    if (this.data.recordsCount === 0) {
      wx.showModal({
        title: '记录不足',
        content: '过去 7 天内暂无记录，快去“首页”随手记录一次便便吧！数据充足后 AI 才能提供更精准的肠道调理方向。',
        showCancel: false
      });
      return;
    }

    this.setData({ isGenerating: true });
    this.rotateLoadingTips();

    // 1. 获取过去 7 天排便记录
    const startTs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let records = [];

    if (db) {
      const _ = db.command;
      try {
        const res = await db.collection('poop_records')
          .where({ timestamp: _.gte(startTs) })
          .orderBy('timestamp', 'asc')
          .get();
        records = res.data;
      } catch (err) {
        console.error('云端读取记录失败', err);
      }
    } else {
      const list = wx.getStorageSync('local_poop_records') || [];
      records = list.filter(item => item.timestamp >= startTs);
      records.sort((a, b) => a.timestamp - b.timestamp);
    }

    const startDateStr = records[0].date;
    const endDateStr = records[records.length - 1].date;
    const dateRange = `${startDateStr} 至 ${endDateStr}`;

    // 2. 调用 AI 智能分析云函数
    if (db) {
      try {
        const res = await wx.cloud.callFunction({
          name: 'deepseekAnalysis',
          data: { records }
        });

        const result = res.result;
        let reportText = '';

        if (result.success) {
          reportText = result.report;
        } else {
          // 容错降级
          reportText = result.mockReport;
          wx.showToast({
            title: '云服务繁忙，已为您开启智能调优计算',
            icon: 'none',
            duration: 2500
          });
        }

        // 将报告存入健康历史集合
        const saveRes = await db.collection('health_reports').add({
          data: {
            createdAt: db.serverDate(),
            dateRange,
            reportText
          }
        });

        const newReport = {
          _id: saveRes._id,
          dateStr: '刚刚',
          dateRange,
          sections: this.parseMarkdown(reportText)
        };

        this.setData({
          currentReport: newReport,
          isGenerating: false
        });
        
        this.loadHistoryReports();

      } catch (err) {
        console.error('云调用生成报告失败，切换本地健康核算', err);
        this.generateLocalFallbackReport(records, dateRange);
      }
    } else {
      // 纯本地环境
      this.generateLocalFallbackReport(records, dateRange);
    }
  },

  // 本地离线环境降级拼装评估报告
  generateLocalFallbackReport(records, dateRange) {
    const typeCounts = {};
    let totalDuration = 0;
    let healthyCount = 0;
    
    records.forEach(r => {
      typeCounts[r.bristolType] = (typeCounts[r.bristolType] || 0) + 1;
      totalDuration += r.duration || 0;
      if (r.bristolType === 3 || r.bristolType === 4) healthyCount++;
    });

    let mainType = 4;
    let maxCount = 0;
    for (const t in typeCounts) {
      if (typeCounts[t] > maxCount) {
        maxCount = typeCounts[t];
        mainType = parseInt(t, 10);
      }
    }

    const avgDuration = Math.round(totalDuration / records.length);
    const healthyPct = Math.round((healthyCount / records.length) * 100);

    let assessText = '';
    let causeText = '';
    let adviseText = '';

    if (mainType <= 2) {
      assessText = `您的排便形状本周主要集中在 **${mainType}型（散状硬球/凹凸腊肠）**，表明存在较为明显的**便秘指征**。平均单次时长为 **${avgDuration}分钟**。`;
      causeText = `硬球或干硬结块多由身体摄水量不足、主食过细缺乏谷物膳食纤维、平时身体缺乏伸展蠕动导致。`;
      adviseText = `- **黄金补水公式**：建议每日主动分次摄入 1800-2000ml 温水，晨起一杯温开水建立排便反射。\\n- **高纤维膳食搭配**：多摄入西兰花、紫薯、西梅等富含粗可溶纤维的食物。\\n- **控制时限**：排便控制在 5-8 分钟内，有便意才去。`;
    } else if (mainType >= 6) {
      assessText = `您的便便在本周中偏向 **${mainType}型（糊状泥状/水样液体）**，表明肠道不耐受或肠蠕动过快，存在**轻微腹泻、消化不良表现**。`;
      causeText = `质地过软或稀水便多由肠胃受凉、暴饮暴食、吃辣刺激、或肠胃菌群暂时失调引起。`;
      adviseText = `- **温热易消化膳食**：优先选择小米粥、温热挂面，少吃生冷果蔬和油炸辛辣。\\n- **注意补水电解质**：可以多补充温热淡盐水防止脱水。\\n- **防着凉**：尤其注意空调房中的腰腹保暖。`;
    } else {
      assessText = `您的排便性状本周处于 **${mainType}型（完美的光滑香蕉便）**，黄金完美比例高达 **${healthyPct}%**，肠胃吸收状态极佳。`;
      causeText = `说明您的日常膳食习惯、饮水量和作息舒缓度处于极好的平衡状态。`;
      adviseText = `- **继续维持当前的健康机制**：多喝水，多吃新鲜蔬菜粗粮。\\n- **配合温和运动**：坚持每天散步 20 分钟以保养肠胃。`;
    }

    const reportText = `### 📋 整体状况评估
- **排便频次**：最近 7 天共记录排便 **${records.length}** 次。
- **排便时长**：单次平均用时 **${avgDuration} 分钟**。
- **完美黄金比例**：**${healthyPct}%**。
- **排便性状主导分析**：${assessText}

### 🔍 潜在成因探究
- ${causeText}
- 此外，情绪起伏、熬夜缺乏睡眠或换季降温也会引发肠胃的应急反应。

### 🥗 温暖的改善建议
${adviseText}

### ⚠️ 专业免责声明
- *温馨提醒：本报告由舒便算法健康中心生成，仅供日常家庭调理与消化道功能养护参考，不作为正式临床医学诊断依据。若病情反复甚至伴随脓血等，请务必就医诊治。*`;

    const localHistory = wx.getStorageSync('local_health_reports') || [];
    const timestamp = Date.now();
    const newReport = {
      id: 'report_' + timestamp,
      timestamp,
      dateStr: '刚刚',
      dateRange,
      sections: this.parseMarkdown(reportText)
    };

    localHistory.push({
      id: newReport.id,
      timestamp,
      dateRange,
      reportText
    });
    wx.setStorageSync('local_health_reports', localHistory);

    setTimeout(() => {
      this.setData({
        currentReport: newReport,
        isGenerating: false
      });
      this.loadHistoryReports();
    }, 1500);
  },

  // 轮播温馨等候文案，舒缓焦躁感
  rotateLoadingTips() {
    const tips = [
      'AI 肠道家庭医生正在仔细研读您的排便记录...',
      '正在智能比对布里斯托大便分类指数...',
      '正在结合备注多维度探索潜在生活成因...',
      '正在为您量身剪裁专属的膳食和补水建议...',
      '正在整理温馨、科学的私人医生小贴士...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (!this.data.isGenerating) {
        clearInterval(interval);
        return;
      }
      this.setData({ loadingTip: tips[i % tips.length] });
      i++;
    }, 3000);
  },

  // 点击历史调出详情卡片
  viewHistoryDetail(e) {
    const id = e.currentTarget.dataset.id;
    const report = this.data.historyReports.find(r => (r._id === id || r.id === id));
    if (report) {
      this.setData({ currentReport: report });
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 300
      });
    }
  },

  // 退出阅读卡片
  closeCurrentReport() {
    this.setData({ currentReport: null });
  }
});