// app.js
App({
  onLaunch: function () {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: 'cloudbase-4gled37s943c3271',
        traceUser: true,
      });
    }

    // 全局数据
    this.globalData = {
      userInfo: null
    };

    // 从本地存储获取用户信息
    this.getUserInfoFromStorage();
  },

  getUserInfoFromStorage: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  },

  saveUserInfoToStorage: function(userInfo) {
    this.globalData.userInfo = userInfo;
    wx.setStorageSync('userInfo', userInfo);
  },

  clearUserInfo: function() {
    this.globalData.userInfo = null;
    wx.removeStorageSync('userInfo');
  },

  getOpenid: function(callback) {
    wx.cloud.callFunction({
      name: 'getOpenid',
      success: res => {
        const openid = res.result.openid;
        if (callback) {
          callback(openid);
        }
      },
      fail: err => {
        console.error('openid获取失败', err);
        if (callback) {
          callback(null);
        }
      }
    });
  },

  globalData: {
    userInfo: null
  }
});