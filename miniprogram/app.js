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

    this.loadAuthStateFromStorage();
    this.tryRestoreLoginSession();
  },

  loadAuthStateFromStorage: function () {
    const userProfile = wx.getStorageSync('userProfile');
    const loginStatus = !!wx.getStorageSync('loginStatus');
    this.globalData.userProfile = userProfile || null;
    this.globalData.isLoggedIn = loginStatus && !!userProfile;
    this.globalData.userInfo = userProfile ? {
      nickName: userProfile.nickName,
      avatarUrl: userProfile.avatarUrl
    } : null;
  },

  tryRestoreLoginSession: function () {
    if (!this.globalData.isLoggedIn || !this.globalData.userProfile) {
      return;
    }
    this.getOpenid((openid) => {
      if (!openid) {
        this.clearLoginStatus();
        return;
      }
      this.globalData.userInfo = {
        ...this.globalData.userProfile,
        openid
      };
    });
  },

  saveUserProfileToStorage: function (profile) {
    this.globalData.userProfile = {
      nickName: profile.nickName,
      avatarUrl: profile.avatarUrl
    };
    wx.setStorageSync('userProfile', this.globalData.userProfile);
  },

  setLoginStatus: function (status) {
    this.globalData.isLoggedIn = !!status;
    if (status) {
      wx.setStorageSync('loginStatus', true);
    } else {
      wx.removeStorageSync('loginStatus');
    }
  },

  completeLogin: function ({ openid, nickName, avatarUrl }) {
    this.saveUserProfileToStorage({ nickName, avatarUrl });
    this.setLoginStatus(true);
    this.globalData.userInfo = { openid, nickName, avatarUrl };
  },

  clearLoginStatus: function () {
    this.setLoginStatus(false);
    this.globalData.userInfo = null;
  },

  hasCachedUserProfile: function () {
    const profile = this.globalData.userProfile;
    return !!(profile && profile.nickName && profile.avatarUrl);
  },

  loginWithCachedProfile: function (callback) {
    const profile = this.globalData.userProfile;
    if (!this.hasCachedUserProfile()) {
      if (callback) callback(false);
      return;
    }
    this.getOpenid((openid) => {
      if (!openid) {
        if (callback) callback(false);
        return;
      }
      wx.cloud.callFunction({
        name: 'createUser',
        data: {
          openid,
          nickName: profile.nickName,
          avatarUrl: profile.avatarUrl
        },
        success: (res) => {
          if (res.result && res.result.success) {
            this.completeLogin({
              openid,
              nickName: profile.nickName,
              avatarUrl: profile.avatarUrl
            });
            if (callback) callback(true);
          } else if (callback) {
            callback(false);
          }
        },
        fail: () => {
          if (callback) callback(false);
        }
      });
    });
  },

  getOpenid: function (callback) {
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
    userInfo: null,
    userProfile: null,
    isLoggedIn: false
  }
});