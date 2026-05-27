var STORAGE_KEY_START = 'timer_start_time';
var STORAGE_KEY_STATE = 'timer_state';

function start() {
  var now = Date.now();
  wx.setStorageSync(STORAGE_KEY_START, now);
  wx.setStorageSync(STORAGE_KEY_STATE, 'running');
  return now;
}

function stop() {
  var startTime = wx.getStorageSync(STORAGE_KEY_START);
  wx.removeStorageSync(STORAGE_KEY_START);
  wx.setStorageSync(STORAGE_KEY_STATE, 'idle');
  if (!startTime) return 0;
  return Math.floor((Date.now() - startTime) / 1000);
}

function getElapsedSeconds() {
  var startTime = wx.getStorageSync(STORAGE_KEY_START);
  if (!startTime) return 0;
  return Math.floor((Date.now() - startTime) / 1000);
}

function isRunning() {
  return wx.getStorageSync(STORAGE_KEY_STATE) === 'running';
}

function formatTime(totalSeconds) {
  var h = Math.floor(totalSeconds / 3600);
  var m = Math.floor((totalSeconds % 3600) / 60);
  var s = totalSeconds % 60;
  return [h, m, s].map(function (v) { return String(v).padStart(2, '0'); }).join(':');
}

function getDurationMinutes() {
  var seconds = getElapsedSeconds();
  return Math.max(1, Math.ceil(seconds / 60));
}

module.exports = {
  start: start,
  stop: stop,
  getElapsedSeconds: getElapsedSeconds,
  isRunning: isRunning,
  formatTime: formatTime,
  getDurationMinutes: getDurationMinutes
};
