// pages/index/index.js
const util = require("../../utils/util.js");
const config = require("../../utils/config.js");

Page({
  data: {
    posts: [],
    loading: false,
    loadingMore: false,
    searchValue: '',
    isSearching: false,
    page: 1,
    pageSize: config.pageSize,
    hasMore: true,
    initialLoad: false
  },

  onLoad: function () {
    this._skipNextOnShowRefresh = true;
    this.getPosts();
  },

  onShow: function () {
    const tabBar = this.getTabBar();
    if (tabBar) {
      tabBar.setData({ selected: 0 });
    }
    if (this._skipNextOnShowRefresh) {
      this._skipNextOnShowRefresh = false;
      return;
    }
    // 页面再次显示时重新获取帖子列表，确保数据最新
    this.getPosts(this.data.searchValue);
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.getPosts(this.data.searchValue);
    // 停止下拉动画
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 500);
  },

  // 获取帖子列表
  getPosts: function (clubName, loadMore = false) {
    const that = this;
    
    if (!loadMore) {
      that.setData({ loading: true, page: 1 });
    } else {
      that.setData({ loadingMore: true });
    }

    wx.cloud.callFunction({
      name: 'getPosts',
      data: {
        page: loadMore ? that.data.page : 1,
        pageSize: that.data.pageSize,
        clubName: clubName || ''
      },
      success: function (res) {
        if (res.result.success) {
          // 格式化时间
          const newPosts = res.result.data.posts.map(post => {
            return {
              ...post,
              createTime: util.formatTime(post.createTime),
              viewCount: util.formatViewCount(post.viewCount)
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
          wx.showToast({ title: '获取帖子失败', icon: 'none' });
          that.setData({ loading: false, loadingMore: false, initialLoad: true });
        }
      },
      fail: function (err) {
        console.error('获取帖子失败:', err);
        wx.showToast({ title: '获取帖子失败', icon: 'none' });
        that.setData({ loading: false, loadingMore: false, initialLoad: true });
      }
    });
  },

  // 滚动到底部加载更多
  onReachBottom: function () {
    if (this.data.loadingMore || !this.data.hasMore) {
      return;
    }
    this.getPosts(this.data.searchValue, true);
  },

  // 搜索输入
  onSearchInput: function (e) {
    const keyword = e.detail.value;
    this.setData({ searchValue: keyword });
    
    if (!keyword) {
      this.clearSearch();
    }
  },

  // 搜索
  onSearch: function (e) {
    const clubName = (e.detail.value || this.data.searchValue || '').trim();
    if (!clubName) {
      this.clearSearch();
      return;
    }
    
    this.setData({ isSearching: true });
    this.getPosts(clubName);
  },

  // 清空搜索
  clearSearch: function () {
    this.setData({ 
      searchValue: '',
      isSearching: false
    });
    this.getPosts();
  },

  // 跳转到发布页
  goToPublish: function () {
    wx.switchTab({
      url: '/pages/publish/index'
    });
  },

  // 跳转到帖子详情页
  goToPostDetail: function (e) {
    console.log('goToPostDetail index', e.detail);

    const postId = e.detail.postId;
    const postData = e.detail.postData;
    wx.navigateTo({
      url: '/pages/post/index?postId=' + postId + '&source=index',
      success: function(res) {
        res.eventChannel.emit('initData', { postData: postData, source: 'index' });
      }
    });
  },

});
