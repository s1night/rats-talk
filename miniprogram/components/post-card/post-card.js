const config = require("../../utils/config.js");

Component({
  properties: {
    post: {
      type: Object,
      value: {}
    },
    showAvatar: {
      type: Boolean,
      value: true
    },
    showIdentity: {
      type: Boolean,
      value: false
    },
    showStatus: {
      type: Boolean,
      value: false
    },
    showViewCount: {
      type: Boolean,
      value: true
    },
    showMoreButton: {
      type: Boolean,
      value: false
    },
    contentPrefix: {
      type: String,
      value: ''
    },
    showFullContent: {
      type: Boolean,
      value: false
    }
  },

  data: {
    identityConfig: config.identity,
    isInteracting: false
  },
  
  methods: {
    onTap() {
      console.log('点击帖子卡片');      
      this.triggerEvent('tap', {
        postId: this.data.post._id,
        postData: this.data.post
      });
    },
    onMoreTap() {
      this.triggerEvent('moreTap', {
        postId: this.data.post._id
      });
    },
    onUsefulTap() {
      this.interact('useful');
    },
    onUselessTap() {
      this.interact('useless');
    },
    interact(type) {
      if (this.data.isInteracting) {
        return;
      }

      const post = this.data.post || {};
      const postId = post._id;
      const app = getApp();
      const userInfo = app.globalData.userInfo || {};

      if (!userInfo.openid) {
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
            return;
          }
          // 前端已做乐观更新，请求成功后保持当前 UI 状态。
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
    getNextPostState(post, type) {
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
    }
  }
});
