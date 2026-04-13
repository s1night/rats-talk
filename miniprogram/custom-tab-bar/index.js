Component({
  data: {
    selected: 0,
    color: "#666666",
    selectedColor: "#000000"
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      const index = data.index;
      
      // 如果当前已经在本页面，则不触发点击逻辑
      if (index === this.data.selected) {
        return;
      }
      
      wx.switchTab({ url });
    },
    goToPublish() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      // 游客模式，跳转到个人中心引导登录
      wx.switchTab({ url: '/pages/profile/index' });
      return;
    }
    wx.navigateTo({ url: '/pages/publish/index' });
  }
  },

  attached() {
    // 初始化时不设置selected，由页面的onShow方法控制
  },

  show() {
    // 显示时不设置selected，由页面的onShow方法控制
  }
});
