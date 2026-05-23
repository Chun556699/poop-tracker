// pages/mine/mine.js
Page({
  data: {
    userInfo: {
      avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2UTgVYia8icgZCOfMTNeyFscD6v1ic0Z6WclL8XQX5C7Uu6TOfg/0', // 微信官方默认灰色头像占位符
      nickName: '舒便健康官'
    },
    syncStatus: '已同步',
    showScience: false,
    showAbout: false,
    scienceList: [
      { type: 1, name: '1型 散状硬球', subtitle: '严重便秘 🌰', desc: '坚硬的一颗颗硬球，像坚果。极难排出，说明大肠吸水过剩，体内极度干涸、火气较盛，需急需补水与增加肠道油脂。' },
      { type: 2, name: '2型 凹凸腊肠', subtitle: '轻微便秘 🪵', desc: '呈腊肠状，但表面凹凸不平、充满挤压凸起的硬块。表示肠道蠕动偏缓，膳食纤维与温水摄入偏少。' },
      { type: 3, name: '3型 裂纹腊肠', subtitle: '稍微干燥 🥖', desc: '呈腊肠状，表面有均匀裂纹。虽然稍微干燥，但属于正常排便范围，一般早晨多喝一大温杯水便可改善。' },
      { type: 4, name: '4型 光滑香蕉', subtitle: '完美黄金状态 🍌', desc: '呈光滑、柔软的长条香蕉状。最完美的状态，排便极其顺畅无压力，代表肠胃菌群生态极度健康！' },
      { type: 5, name: '5型 软质断块', subtitle: '纤维不足 🍞', desc: '边缘清晰且柔软的断开团块，易排出。提示身体可以适当多摄入糙米、燕麦、西兰花等植物膳食粗纤维。' },
      { type: 6, name: '6型 糊状泥状', subtitle: '轻微腹泻 🥣', desc: '呈碎块、糊状或不规则的散状泥。多由于胃肠道敏感、着凉受冻、暴饮暴食或轻度乳糖不耐。' },
      { type: 7, name: '7型 水样无固体', subtitle: '严重腹泻 💧', desc: '水样液体，无任何固体。可能由于细菌感染急性肠胃炎、食物变质中毒导致，建议尽快补充温热电解质防脱水并及时就医。' }
    ]
  },

  onShow() {
    // 检查云开发是否初始化就绪
    if (wx.cloud) {
      this.setData({ syncStatus: '☁️ 微信云端实时同步' });
    } else {
      this.setData({ syncStatus: '📱 本地多端存储' });
    }
  },

  // 科普窗口
  openScience() {
    this.setData({ showScience: true });
  },

  closeScience() {
    this.setData({ showScience: false });
  },

  // 关于窗口
  openAbout() {
    this.setData({ showAbout: true });
  },

  closeAbout() {
    this.setData({ showAbout: false });
  },

  // 清除本地缓存
  clearCache() {
    wx.showModal({
      title: '确定清空所有本地数据？',
      content: '清除后，本地所有排便记录与 AI 生成报告都将永久抹除，且此操作不可逆。',
      confirmColor: '#E8A08A',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.showToast({
            title: '重置清除成功',
            icon: 'success'
          });
        }
      }
    });
  }
});