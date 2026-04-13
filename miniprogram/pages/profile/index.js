Page({
  data: {
    userInfo: {},
    isLoggedIn: false
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
  },

  goToAuth: function () {
    const app = getApp();
    if (app.globalData.isLoggedIn) {
      wx.showToast({ title: '已登录', icon: 'none', duration: 500 });
      return;
    }
    if (app.hasCachedUserProfile()) {
      app.loginWithCachedProfile((success) => {
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
