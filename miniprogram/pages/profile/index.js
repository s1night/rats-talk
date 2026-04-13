Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    isAuthing: false,
    myPostCount: 0,
    myUsefulCount: 0
  },

  onLoad: function () {
    this.syncUserInfo();
  },

  onShow: function () {
    const tabBar = this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 1 });
    }
    this.syncUserInfo();
  },

  syncUserInfo: function () {
    const app = getApp();
    const userInfo = app.globalData.userInfo || {};
    this.setData({
      userInfo: userInfo,
      isLoggedIn: !!app.globalData.isLoggedIn
    });
    if (app.globalData.isLoggedIn) {
      this.loadMyStats();
    } else {
      this.setData({
        myPostCount: 0,
        myUsefulCount: 0
      });
    }
  },

  loadMyStats: function () {
    wx.cloud.callFunction({
      name: 'getMyPosts',
      data: {
        page: 1,
        pageSize: 1
      },
      success: (res) => {
        if (!res.result || !res.result.success || !res.result.data) {
          return;
        }
        this.setData({
          myPostCount: Number(res.result.data.total || 0),
          myUsefulCount: Number(res.result.data.totalUsefulCount || 0)
        });
      }
    });
  },

  goToAuth: function () {
    const app = getApp();
    if (this.data.isAuthing) {
      return;
    }
    if (app.globalData.isLoggedIn) {
      wx.showToast({ title: '已登录', icon: 'none', duration: 500 });
      return;
    }
    if (app.hasCachedUserProfile()) {
      this.setData({ isAuthing: true });
      wx.showLoading({ title: '登录中...', mask: true });
      app.loginWithCachedProfile((success) => {
        wx.hideLoading();
        this.setData({ isAuthing: false });
        if (success) {
          this.syncUserInfo();
          wx.showToast({ title: '登录成功', icon: 'success', duration: 500 });
          return;
        }
        wx.navigateTo({ url: '/pages/auth/index' });
      });
      return;
    }
    wx.navigateTo({ url: '/pages/auth/index' });
  },

  goToPublish: function () {
    wx.navigateTo({
      url: '/pages/publish/index'
    });
  },

  goToMyPosts: function () {
    wx.navigateTo({
      url: '/pages/my-posts/index'
    });
  },

  goToHelpCenter: function () {
    wx.showToast({ title: '功能开发中', icon: 'none', duration: 500 });
  },

  goToAboutUs: function () {
    wx.showToast({ title: '功能开发中', icon: 'none', duration: 500 });
  },

  goToUserAgreement: function () {
    wx.showToast({ title: '功能开发中', icon: 'none', duration: 500 });
  },

  goToPrivacyPolicy: function () {
    wx.showToast({ title: '功能开发中', icon: 'none', duration: 500 });
  },

  logout: function () {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号吗？',
      success: (res) => {
        if (!res.confirm) {
          return;
        }
        const app = getApp();
        app.clearLoginStatus();
        this.setData({
          userInfo: app.globalData.userProfile || {},
          isLoggedIn: false
        });
        wx.showToast({ title: '已退出登录', icon: 'success', duration: 500 });
      }
    });
  }
});
