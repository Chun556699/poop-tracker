// pages/record/record.js
const db = wx.cloud ? wx.cloud.database() : null;

Page({
  data: {
    recordId: '', // 用于编辑模式下的记录 ID
    date: '',
    time: '',
    duration: 5,
    selectedType: 4,
    photoPath: '', // 本地预览路径
    photoCloudId: '', // 云存储 FileID
    notes: '',
    isSubmitting: false,
    maxDate: '' // 日期上限
  },

  onLoad: function (options) {
    // 默认日期和具体时刻初始化
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    this.setData({
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
      maxDate: `${year}-${month}-${day}`
    });

    // 如果是通过点击卡片或历史记录编辑跳转，加载对应数据
    if (options.id) {
      this.setData({ recordId: options.id });
      this.loadRecordDetails(options.id);
    }
  },

  // 获取特定排便记录详情
  loadRecordDetails(id) {
    if (!db) {
      // 降级本地缓存编辑
      const list = wx.getStorageSync('local_poop_records') || [];
      const item = list.find(i => i.id === id);
      if (item) {
        this.setData({
          date: item.date,
          time: item.time,
          duration: item.duration,
          selectedType: item.bristolType,
          photoPath: item.photoUrl || '',
          photoCloudId: item.photoUrl || '',
          notes: item.notes || ''
        });
      }
      return;
    }

    wx.showLoading({ title: '加载中...' });
    db.collection('poop_records').doc(id).get().then(res => {
      wx.hideLoading();
      const r = res.data;
      this.setData({
        date: r.date,
        time: r.time,
        duration: r.duration,
        selectedType: r.bristolType,
        photoPath: r.photoUrl || '',
        photoCloudId: r.photoUrl || '',
        notes: r.notes || ''
      });
    }).catch(err => {
      wx.hideLoading();
      console.error('获取记录失败', err);
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  // 时间选择
  onTimeChange(e) {
    this.setData({ time: e.detail.value });
  },

  // 排便时长滑动条
  onDurationChange(e) {
    this.setData({ duration: e.detail.value });
  },

  // 布里斯托形状选中变更
  onBristolChange(e) {
    this.setData({ selectedType: e.detail.type });
  },

  // 备注变更
  onNotesInput(e) {
    this.setData({ notes: e.detail.value });
  },

  // 拍照或选择照片
  choosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          photoPath: tempFilePath
        });
      }
    });
  },

  // 删除当前选中的图片
  deletePhoto() {
    this.setData({
      photoPath: '',
      photoCloudId: ''
    });
  },

  // 保存排便数据（包含云上传流程）
  async saveRecord() {
    if (this.data.isSubmitting) return;
    this.setData({ isSubmitting: true });

    wx.showLoading({ title: '保存中...', mask: true });

    try {
      let finalPhotoUrl = this.data.photoCloudId;

      // 如果有本地图片且尚未上传到云端（或者是新选的本地临时路径）
      if (this.data.photoPath && !this.data.photoPath.startsWith('cloud://')) {
        const filePath = this.data.photoPath;
        const ext = filePath.split('.').pop() || 'png';
        const cloudPath = `poop_photos/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;

        const uploadRes = await wx.cloud.uploadFile({
          cloudPath,
          filePath
        });
        finalPhotoUrl = uploadRes.fileID;
      }

      const timestamp = new Date(`${this.data.date}T${this.data.time}`).getTime();

      const recordData = {
        date: this.data.date,
        time: this.data.time,
        timestamp,
        duration: parseInt(this.data.duration, 10),
        bristolType: parseInt(this.data.selectedType, 10),
        photoUrl: finalPhotoUrl,
        notes: this.data.notes,
        updatedAt: new Date()
      };

      if (!db) {
        // 无云开发环境时的降级处理：本地缓存
        this.saveToLocalCache(recordData);
        return;
      }

      if (this.data.recordId) {
        // 更新现有记录
        await db.collection('poop_records').doc(this.data.recordId).update({
          data: recordData
        });
      } else {
        // 新增排便记录
        recordData.createdAt = db.serverDate();
        await db.collection('poop_records').add({
          data: recordData
        });
      }

      wx.hideLoading();
      wx.showToast({
        title: '记录保存成功',
        icon: 'success',
        duration: 1500
      });

      // 延迟返回
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack({ delta: 1 });
        } else {
          wx.switchTab({ url: '/pages/index/index' });
        }
      }, 1500);

    } catch (err) {
      wx.hideLoading();
      this.setData({ isSubmitting: false });
      wx.showModal({
        title: '保存失败',
        content: err.errMsg || '请检查微信云开发配置',
        showCancel: false
      });
      console.error('保存记录出错', err);
    }
  },

  // 纯本地缓存的降级保存方案（若用户尚未开通云开发）
  saveToLocalCache(recordData) {
    const list = wx.getStorageSync('local_poop_records') || [];
    if (this.data.recordId) {
      const idx = list.findIndex(item => item.id === this.data.recordId);
      if (idx > -1) {
        list[idx] = { ...recordData, id: this.data.recordId };
      }
    } else {
      recordData.id = 'local_' + Date.now();
      recordData.createdAt = new Date();
      list.push(recordData);
    }
    wx.setStorageSync('local_poop_records', list);
    wx.hideLoading();
    wx.showToast({
      title: '本地保存成功',
      icon: 'success'
    });
    setTimeout(() => {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 });
      } else {
        wx.switchTab({ url: '/pages/index/index' });
      }
    }, 1500);
  }
});