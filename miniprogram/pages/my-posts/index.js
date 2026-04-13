const util = require("../../utils/util.js");
const config = require("../../utils/config.js");

Page({
  data: {
    posts: [],
    loading: false,
    loadingMore: false,
    page: 1,
    pageSize: config.pageSize,
    hasMore: true,
    initialLoad: false
  },

  onLoad: function () {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/auth/index' });
      }, 800);
      return;
    }
    this._skipNextOnShowRefresh = true;
    this.getMyPosts();
  },

  onShow: function () {
    if (this._skipNextOnShowRefresh) {
      this._skipNextOnShowRefresh = false;
      return;
    }
    this.getMyPosts();
  },

  onPullDownRefresh: function () {
    this.getMyPosts();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500);
  },

  getMyPosts: function (loadMore = false) {
    const app = getApp();
    if (!loadMore) {
      this.setData({ loading: true, page: 1 });
    } else {
      this.setData({ loadingMore: true });
    }

    wx.cloud.callFunction({
      name: 'getMyPosts',
      data: {
        page: loadMore ? this.data.page : 1,
        pageSize: this.data.pageSize
      },
      success: (res) => {
        if (res.result.success) {
          const newPosts = res.result.data.posts.map(post => {
            const statusInfo = this.getStatusInfo(post.status);
            return {
              ...post,
              avatarUrl: app.globalData.userInfo?.avatarUrl || '',
              nickName: app.globalData.userInfo?.nickName || '用户',
              createTime: util.formatTime(post.createTime),
              viewCount: util.formatViewCount(post.viewCount),
              statusText: statusInfo.text,
              statusClass: statusInfo.class
            };
          });

          const posts = loadMore ? [...this.data.posts, ...newPosts] : newPosts;
          this.setData({
            posts,
            loading: false,
            loadingMore: false,
            page: loadMore ? this.data.page + 1 : 2,
            hasMore: newPosts.length >= this.data.pageSize,
            initialLoad: true
          });
        } else {
          wx.showToast({ title: '获取发布列表失败', icon: 'none' });
          this.setData({ loading: false, loadingMore: false, initialLoad: true });
        }
      },
      fail: (err) => {
        console.error('获取发布列表失败:', err);
        wx.showToast({ title: '获取发布列表失败', icon: 'none' });
        this.setData({ loading: false, loadingMore: false, initialLoad: true });
      }
    });
  },

  onReachBottom: function () {
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }
    this.getMyPosts(true);
  },

  getStatusInfo: function (status) {
    if (status === undefined || status === null || status === '' || isNaN(parseInt(status, 10))) {
      return { text: '待审核', class: 'pending' };
    }
    const statusNum = parseInt(status, 10);
    switch (statusNum) {
      case 0:
        return { text: '待审核', class: 'pending' };
      case 1:
        return { text: '已通过', class: 'approved' };
      case 2:
        return { text: '已拒绝', class: 'rejected' };
      default:
        return { text: '待审核', class: 'pending' };
    }
  },

  goToPublish: function () {
    wx.navigateTo({
      url: '/pages/publish/index'
    });
  },

  goToPostDetail: function (e) {
    const postId = e.detail.postId;
    const postData = e.detail.postData;
    wx.navigateTo({
      url: '/pages/post/index?postId=' + postId + '&source=profile',
      success: function (res) {
        res.eventChannel.emit('initData', { postData: postData, source: 'profile' });
      }
    });
  }
});
