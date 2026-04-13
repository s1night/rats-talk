// pages/post/index.js
const util = require("../../utils/util.js");
const config = require("../../utils/config.js");

Page({
  data: {
    post: {},
    showMoreMenu: false,
    loading: true,
    isInteracting: false,
    isOwner: false,
    currentSwiperIndex: 0,
    source: '',
    identityConfig: config.identity
  },

  onLoad: function (options) {
    const postId = options.postId;
    const source = options.source || '';
    const app = getApp();
    const userInfo = app.globalData.userInfo;
    
    // 通过 eventChannel 接收传递的帖子数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('initData', (data) => {
      if (data.postData) {
        const postData = data.postData;
        postData.createTime = util.formatTime(postData.createTime);
        const currentOpenid = userInfo ? userInfo.openid : null;
        const formattedViewCount = util.formatViewCount(postData.viewCount);
        const isOwner = currentOpenid && postData._openid === currentOpenid;
        const dataSource = data.source || source;
        this.setData({ post: postData, formattedViewCount: formattedViewCount, loading: false, isOwner: isOwner, source: dataSource });
      }
    });
    
    if (postId) {
      this.getPostDetail(postId, source);
    }
  },

  // 获取帖子详情
  getPostDetail: function (postId, source = '') {
    const that = this;
    that.setData({ loading: true });

    // 获取当前用户信息
    const app = getApp();
    const userInfo = app.globalData.userInfo;

    wx.cloud.callFunction({
      name: 'getPosts',
      data: {
        postId: postId
      },
      success: function (res) {
        if (res.result && res.result.success && res.result.data && res.result.data.posts && res.result.data.posts.length > 0) {
          const post = res.result.data.posts[0];
          // 格式化时间
          post.createTime = util.formatTime(post.createTime);
          
          // 从globalData获取当前用户的openid
          const currentOpenid = userInfo ? userInfo.openid : null;
          const isOwner = currentOpenid && post._openid === currentOpenid;
          const formattedViewCount = util.formatViewCount(post.viewCount);
          that.setData({ post, formattedViewCount: formattedViewCount, loading: false, isOwner, source });
          
          // 更新浏览量（仅对已审核通过的帖子）
          // 暂时注释掉浏览量更新请求，以后可能还要用
          /*
          if (post.status === 1) {
            that.updateViewCount(postId);
          }
          */
        } else {
          wx.showToast({ title: '获取帖子详情失败', icon: 'none' });
          that.setData({ loading: false });
        }
      },
      fail: function (err) {
        console.error('获取帖子详情失败:', err);
        wx.showToast({ title: '获取帖子详情失败', icon: 'none' });
        that.setData({ loading: false });
      }
    });
  },

  // 更新浏览量
  updateViewCount: function (postId) {
    wx.cloud.callFunction({
      name: 'updateViewCount',
      data: {
        postId: postId
      },
      fail: function (err) {
        console.error('更新浏览量失败:', err);
      }
    });
  },

  // 预览图片
  previewImage: function (e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.post.imgs[index],
      urls: this.data.post.imgs
    });
  },

  // 轮播切换
  onSwiperChange: function (e) {
    this.setData({
      currentSwiperIndex: e.detail.current
    });
  },

  onUsefulTap: function () {
    this.interact('useful');
  },

  onUselessTap: function () {
    this.interact('useless');
  },

  interact: function (type) {
    if (this.data.isInteracting) {
      return;
    }

    const post = this.data.post || {};
    const postId = post._id;
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      wx.showToast({ title: '需要登录才能互动', icon: 'none' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/index' });
      }, 800);
      return;
    }

    if (!postId) {
      return;
    }

    const rollbackPost = { ...post };
    const nextPost = this.getNextPostState(post, type);
    this.setData({
      post: nextPost,
      isInteracting: true
    });

    wx.cloud.callFunction({
      name: 'interactPost',
      data: {
        postId,
        type
      },
      success: (res) => {
        this.setData({ isInteracting: false });
        if (!res.result || !res.result.success) {
          this.setData({ post: rollbackPost });
          wx.showToast({ title: (res.result && res.result.message) || '互动失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({
          post: rollbackPost,
          isInteracting: false
        });
        wx.showToast({ title: '互动失败，请稍后重试', icon: 'none' });
      }
    });
  },

  getNextPostState: function (post, type) {
    const nextPost = { ...post };
    const previousType = nextPost.userInteractionType || '';

    if (previousType === type) {
      nextPost.userInteractionType = '';
      nextPost[`${type}Count`] = Math.max(0, Number(nextPost[`${type}Count`] || 0) - 1);
      return nextPost;
    }

    if (previousType && previousType !== type) {
      nextPost[`${previousType}Count`] = Math.max(0, Number(nextPost[`${previousType}Count`] || 0) - 1);
    }

    nextPost.userInteractionType = type;
    nextPost[`${type}Count`] = Number(nextPost[`${type}Count`] || 0) + 1;
    return nextPost;
  },

  // 显示更多菜单
  showMoreMenu: function () {
    this.setData({
      showMoreMenu: true
    });
  },

  // 隐藏更多菜单
  cancelMoreMenu: function () {
    this.setData({
      showMoreMenu: false
    });
  },

  // 编辑帖子
  editPost: function () {
    this.setData({
      showMoreMenu: false
    });
    const post = this.data.post;
    const editData = {
      postId: post._id,
      identity: post.identity,
      clubName: post.clubName,
      content: post.content,
      imgs: post.imgs || []
    };
    wx.navigateTo({
      url: '/pages/publish/index',
      success: function(res) {
        res.eventChannel.emit('editData', { editData: editData });
      }
    });
  },

  // 删除帖子
  deletePost: function () {
    const that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条帖子吗？',
      success: function (res) {
        if (res.confirm) {
          that.setData({
            showMoreMenu: false
          });
          wx.showLoading({
            title: '删除中...'
          });
          wx.cloud.callFunction({
            name: 'deletePost',
            data: {
              postId: that.data.post._id
            },
            success: function (res) {
              wx.hideLoading();
              if (res.result && res.result.success) {
                wx.showToast({
                  title: '删除成功',
                  icon: 'success'
                });
                setTimeout(function () {
                  wx.navigateBack();
                }, 1500);
              } else {
                wx.showToast({
                  title: res.result.message || '删除失败',
                  icon: 'none'
                });
              }
            },
            fail: function (err) {
              wx.hideLoading();
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
              console.error('删除帖子失败:', err);
            }
          });
        }
      }
    });
  },

});