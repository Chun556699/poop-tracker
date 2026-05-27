const db = wx.cloud ? wx.cloud.database() : null;

Page({
  data: {
    userInfo: {
      avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2UTgVYia8icgZCOfMTNeyFscD6v1ic0Z6WclL8XQX5C7Uu6TOfg/0',
      nickName: '首席拉翔官'
    },
    syncStatus: '📱 本地安全沙盒存储',
    isLoggedIn: false,
    showLoginModal: false,
    tempAvatarUrl: '',
    tempNickName: '',
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
    const info = wx.getStorageSync('local_user_info');
    const hasCloud = !!(db && getApp().globalData.openid);
    this.setData({
      syncStatus: hasCloud ? '☁️ 云端安全同步' : '📱 本地安全沙盒存储',
      userInfo: info || {
        avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2UTgVYia8icgZCOfMTNeyFscD6v1ic0Z6WclL8XQX5C7Uu6TOfg/0',
        nickName: '首席拉翔官'
      },
      isLoggedIn: !!info
    });
  },

  openLoginModal() {
    this.setData({
      showLoginModal: true,
      tempAvatarUrl: this.data.userInfo.avatarUrl,
      tempNickName: this.data.userInfo.nickName === '首席拉翔官' ? '' : this.data.userInfo.nickName
    });
  },

  closeLoginModal() {
    this.setData({ showLoginModal: false });
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    const fs = wx.getFileSystemManager();
    const ext = avatarUrl.split('.').pop() || 'png';
    const savedPath = `${wx.env.USER_DATA_PATH}/avatar_${Date.now()}.${ext}`;

    fs.saveFile({
      tempFilePath: avatarUrl,
      filePath: savedPath,
      success: (res) => {
        this.setData({ tempAvatarUrl: res.savedFilePath });
      },
      fail: (err) => {
        console.error('持久化头像文件失败，降级使用原路径', err);
        this.setData({ tempAvatarUrl: avatarUrl });
      }
    });
  },

  onChooseCustomAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const fs = wx.getFileSystemManager();
        const ext = tempFilePath.split('.').pop() || 'png';
        const savedPath = `${wx.env.USER_DATA_PATH}/custom_avatar_${Date.now()}.${ext}`;

        fs.saveFile({
          tempFilePath,
          filePath: savedPath,
          success: (saveRes) => {
            this.setData({ tempAvatarUrl: saveRes.savedFilePath });
          },
          fail: () => {
            this.setData({ tempAvatarUrl: tempFilePath });
          }
        });
      }
    });
  },

  onNicknameInput(e) {
    this.setData({ tempNickName: e.detail.value });
  },

  onNicknameBlur(e) {
    this.setData({ tempNickName: e.detail.value });
  },

  async confirmLogin() {
    const avatar = this.data.tempAvatarUrl;
    const nickname = this.data.tempNickName.trim();

    if (!nickname) {
      wx.showToast({ title: '请输入或选择微信昵称', icon: 'none' });
      return;
    }

    const info = {
      avatarUrl: avatar || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2UTgVYia8icgZCOfMTNeyFscD6v1ic0Z6WclL8XQX5C7Uu6TOfg/0',
      nickName: nickname
    };

    wx.setStorageSync('local_user_info', info);

    this.setData({
      userInfo: info,
      isLoggedIn: true,
      showLoginModal: false,
      syncStatus: '☁️ 云端安全同步'
    });

    wx.showToast({ title: '授权登录成功 🎉', icon: 'success' });

    if (db) {
      try {
        const res = await wx.cloud.callFunction({
          name: 'syncProfile',
          data: { avatarUrl: info.avatarUrl, nickName: info.nickName }
        });
        if (res.result && res.result.code === 0) {
          this.setData({ syncStatus: '☁️ 云端安全同步' });
        }
      } catch (err) {
        console.error('云端同步个人资料失败', err);
      }
    }
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出当前微信账号登录吗？退出后将回归匿名拉翔身份。',
      confirmColor: '#E8A08A',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('local_user_info');
          this.setData({
            userInfo: {
              avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2UTgVYia8icgZCOfMTNeyFscD6v1ic0Z6WclL8XQX5C7Uu6TOfg/0',
              nickName: '首席拉翔官'
            },
            isLoggedIn: false,
            syncStatus: '📱 本地安全沙盒存储'
          });
          wx.showToast({ title: '已安全退出登录', icon: 'none' });
        }
      }
    });
  },

  openScience() {
    this.setData({ showScience: true });
  },

  closeScience() {
    this.setData({ showScience: false });
  },

  openAbout() {
    this.setData({ showAbout: true });
  },

  closeAbout() {
    this.setData({ showAbout: false });
  },

  goToLeaderboard() {
    wx.navigateTo({
      url: '/pages/leaderboard/leaderboard'
    });
  },

  clearCache() {
    wx.showModal({
      title: '确定清空所有本地数据？',
      content: '清除后，本地所有排便记录都将永久抹除，且此操作不可逆。',
      confirmColor: '#E8A08A',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          this.setData({
            userInfo: {
              avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2UTgVYia8icgZCOfMTNeyFscD6v1ic0Z6WclL8XQX5C7Uu6TOfg/0',
              nickName: '首席拉翔官'
            },
            isLoggedIn: false
          });
          wx.showToast({ title: '重置清除成功', icon: 'success' });
        }
      }
    });
  }
});
