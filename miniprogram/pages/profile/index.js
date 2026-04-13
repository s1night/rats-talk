// pages/profile/index.js
const util = require("../../utils/util.js");
const config = require("../../utils/config.js");

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
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
    const userInfo = app.globalData.userInfo || {};
    this.setData({ 
      userInfo: userInfo,
      isLoggedIn: !!userInfo.openid 
    });
    if (userInfo.openid) {
      this.getMyPosts();
    }
  },

  onShow: function () {
    const tabBar = this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 1 });
    }
    const app = getApp();
    const userInfo = app.globalData.userInfo || {};
    this.setData({ 
      userInfo: userInfo,
      isLoggedIn: !!userInfo.openid 
    });
    if (userInfo.openid) {
      this.getMyPosts();
    }
  },

  // 跳转到授权页面
  goToAuth: function () {
    wx.navigateTo({ url: '/pages/auth/index' });
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.getMyPosts();
    // 停止下拉动画
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500);
  },

  // 获取我的发布列表
  getMyPosts: function (loadMore = false) {
    const that = this;
    const app = getApp();
    
    if (!loadMore) {
      that.setData({ loading: true, page: 1 });
    } else {
      that.setData({ loadingMore: true });
    }

    wx.cloud.callFunction({
      name: 'getMyPosts',
      data: {
        page: loadMore ? that.data.page : 1,
        pageSize: that.data.pageSize
      },
      success: function (res) {
        if (res.result.success) {
          // 格式化时间和状态
          const newPosts = res.result.data.posts.map(post => {
            const statusInfo = that.getStatusInfo(post.status);
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
          
          let posts;
          if (loadMore) {
            posts = [...that.data.posts, ...newPosts];
          } else {
            posts = newPosts;
          }
          
          that.setData({ 
            posts,
            loading: false,
            loadingMore: false,
            page: loadMore ? that.data.page + 1 : 2,
            hasMore: newPosts.length >= that.data.pageSize,
            initialLoad: true
          });
        } else {
          wx.showToast({ title: '获取发布列表失败', icon: 'none' });
          that.setData({ loading: false, loadingMore: false, initialLoad: true });
        }
      },
      fail: function (err) {
        console.error('获取发布列表失败:', err);
        wx.showToast({ title: '获取发布列表失败', icon: 'none' });
        that.setData({ loading: false, loadingMore: false, initialLoad: true });
      }
    });
  },

  // 滚动到底部加载更多
  onReachBottom: function () {
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }
    this.getMyPosts(true);
  },

  // 获取状态信息（文本和样式类）
  getStatusInfo: function (status) {
    // 处理各种边界情况
    if (status === undefined || status === null || status === '' || isNaN(parseInt(status))) {
      return { text: '待审核', class: 'pending' };
    }
    const statusNum = parseInt(status);
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

  // 跳转到发布页
  goToPublish: function () {
    wx.navigateTo({
      url: '/pages/publish/index'
    });
  },

  // 跳转到帖子详情页
  goToPostDetail: function (e) {
    console.log('goToPostDetail profile', e.detail);
    const postId = e.detail.postId;
    const postData = e.detail.postData;
    wx.navigateTo({
      url: '/pages/post/index?postId=' + postId + '&source=profile',
      success: function(res) {
        res.eventChannel.emit('initData', { postData: postData, source: 'profile' });
      }
    });
  },

});
