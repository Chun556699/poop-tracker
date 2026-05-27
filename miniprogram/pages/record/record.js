const db = wx.cloud ? wx.cloud.database() : null;

Page({
  data: {
    recordId: '',
    date: '',
    time: '',
    duration: 5,
    selectedType: 4,
    photoPath: '',
    photoCloudId: '',
    notes: '',
    isSubmitting: false,
    maxDate: ''
  },

  onLoad: function (options) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    var initialDuration = 5;

    if (options.timerDuration && !options.id) {
      var timerDur = parseInt(options.timerDuration, 10);
      if (timerDur >= 1 && timerDur <= 60) {
        initialDuration = timerDur;
      }
    }

    this.setData({
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
      duration: initialDuration,
      maxDate: `${year}-${month}-${day}`
    });

    if (options.id) {
      this.setData({ recordId: options.id });
      this.loadRecordDetails(options.id);
    }
  },

  loadRecordDetails(id) {
    const app = getApp();
    const openid = app.globalData.openid;

    if (!db) {
      const list = wx.getStorageSync('local_poop_records') || [];
      const item = list.find(i => i.id === id && i._openid === openid);
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
    db.collection('poop_records').where({ _id: id, _openid: openid }).get().then(res => {
      wx.hideLoading();
      if (res.data.length === 0) {
        wx.showToast({ title: '无权访问此记录', icon: 'none' });
        return;
      }
      const r = res.data[0];
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

  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  onTimeChange(e) {
    this.setData({ time: e.detail.value });
  },

  onDurationChange(e) {
    const val = parseInt(e.detail.value, 10);
    if (val >= 1 && val <= 30) {
      this.setData({ duration: val });
    }
  },

  onBristolChange(e) {
    const type = parseInt(e.detail.type, 10);
    if (type >= 1 && type <= 7) {
      this.setData({ selectedType: type });
    }
  },

  onNotesInput(e) {
    const val = e.detail.value;
    if (val.length <= 200) {
      this.setData({ notes: val });
    }
  },

  choosePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ photoPath: res.tempFiles[0].tempFilePath });
      }
    });
  },

  deletePhoto() {
    this.setData({ photoPath: '', photoCloudId: '' });
  },

  validateRecord(recordData) {
    if (!recordData.date || !recordData.time) {
      wx.showToast({ title: '请选择日期和时间', icon: 'none' });
      return false;
    }
    if (!recordData.timestamp || isNaN(recordData.timestamp)) {
      wx.showToast({ title: '日期时间格式无效', icon: 'none' });
      return false;
    }
    if (recordData.duration < 1 || recordData.duration > 60) {
      wx.showToast({ title: '时长范围 1-60 分钟', icon: 'none' });
      return false;
    }
    if (recordData.bristolType < 1 || recordData.bristolType > 7) {
      wx.showToast({ title: '请选择有效的便便类型', icon: 'none' });
      return false;
    }
    if (recordData.notes && recordData.notes.length > 200) {
      wx.showToast({ title: '备注不超过200字', icon: 'none' });
      return false;
    }
    return true;
  },

  async saveRecord() {
    if (this.data.isSubmitting) return;
    this.setData({ isSubmitting: true });

    const app = getApp();
    const openid = app.globalData.openid;

    const timestamp = new Date(`${this.data.date}T${this.data.time}`).getTime();

    const recordData = {
      date: this.data.date,
      time: this.data.time,
      timestamp,
      duration: parseInt(this.data.duration, 10),
      bristolType: parseInt(this.data.selectedType, 10),
      photoUrl: this.data.photoCloudId,
      notes: (this.data.notes || '').trim(),
      updatedAt: new Date()
    };

    if (!this.validateRecord(recordData)) {
      this.setData({ isSubmitting: false });
      return;
    }

    wx.showLoading({ title: '保存中...', mask: true });

    try {
      let finalPhotoUrl = this.data.photoCloudId;

      if (this.data.photoPath && !this.data.photoPath.startsWith('cloud://')) {
        const filePath = this.data.photoPath;
        const ext = filePath.split('.').pop() || 'png';
        const cloudPath = `poop_photos/${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
        const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath });
        finalPhotoUrl = uploadRes.fileID;
      }

      recordData.photoUrl = finalPhotoUrl;

      if (!db) {
        this.saveToLocalCache(recordData, openid);
        return;
      }

      if (this.data.recordId) {
        await db.collection('poop_records')
          .where({ _id: this.data.recordId, _openid: openid })
          .update({ data: recordData });
      } else {
        recordData.createdAt = db.serverDate();
        await db.collection('poop_records').add({ data: recordData });
      }

      this.logOperation(openid, this.data.recordId ? 'update' : 'create');

      wx.hideLoading();
      wx.showToast({ title: '记录保存成功', icon: 'success', duration: 1500 });

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

  logOperation(openid, action) {
    try {
      const logEntry = {
        openid: openid || 'local',
        action,
        recordId: this.data.recordId || '',
        date: this.data.date,
        timestamp: Date.now()
      };
      const logs = wx.getStorageSync('op_logs') || [];
      logs.push(logEntry);
      if (logs.length > 500) logs.splice(0, logs.length - 500);
      wx.setStorageSync('op_logs', logs);
    } catch (e) {
      console.error('日志写入失败', e);
    }
  },

  saveToLocalCache(recordData, openid) {
    const list = wx.getStorageSync('local_poop_records') || [];
    if (this.data.recordId) {
      const idx = list.findIndex(item => item.id === this.data.recordId && item._openid === openid);
      if (idx > -1) {
        list[idx] = { ...recordData, id: this.data.recordId, _openid: openid };
      }
    } else {
      recordData.id = 'local_' + Date.now();
      recordData._openid = openid;
      recordData.createdAt = new Date();
      list.push(recordData);
    }
    wx.setStorageSync('local_poop_records', list);
    wx.hideLoading();
    wx.showToast({ title: '本地保存成功', icon: 'success' });
    setTimeout(() => {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack({ delta: 1 });
      } else {
        wx.switchTab({ url: '/pages/index/index' });
      }
    }, 1500);
  },

  deleteRecord() {
    wx.showModal({
      title: '确认删除',
      content: '删除后记录将不可恢复，确定要删除这条排便记录吗？',
      confirmColor: '#E8A08A',
      confirmText: '确认删除',
      success: (res) => {
        if (!res.confirm) return;
        this.doDeleteRecord();
      }
    });
  },

  doDeleteRecord() {
    wx.showLoading({ title: '删除中...', mask: true });
    const app = getApp();
    const openid = app.globalData.openid;

    const deleteFromCloud = async () => {
      try {
        await db.collection('poop_records')
          .where({ _id: this.data.recordId, _openid: openid })
          .remove();
        this.logOperation(openid, 'delete');
        wx.hideLoading();
        wx.showToast({ title: '记录已删除', icon: 'success', duration: 1500 });
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
        wx.showToast({ title: '删除失败，请重试', icon: 'none' });
        console.error('删除记录失败', err);
      }
    };

    const deleteFromLocal = () => {
      const list = wx.getStorageSync('local_poop_records') || [];
      const idx = list.findIndex(item => item.id === this.data.recordId && item._openid === openid);
      if (idx > -1) {
        list.splice(idx, 1);
        wx.setStorageSync('local_poop_records', list);
      }
      wx.hideLoading();
      wx.showToast({ title: '记录已删除', icon: 'success', duration: 1500 });
      setTimeout(() => {
        const pages = getCurrentPages();
        if (pages.length > 1) {
          wx.navigateBack({ delta: 1 });
        } else {
          wx.switchTab({ url: '/pages/index/index' });
        }
      }, 1500);
    };

    if (!db) {
      deleteFromLocal();
    } else {
      deleteFromCloud();
    }
  }
});
