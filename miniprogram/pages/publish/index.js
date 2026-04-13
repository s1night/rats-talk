// pages/publish/index.js
const config = require("../../utils/config.js");
Page({
  data: {
    identity: 1,
    clubName: '',
    content: '',
    imgs: [],
    originalImgs: [],
    isEdit: false,
    postId: null,
    loading: false,
    identityConfig: config.identity
  },

  onLoad: function (options) {
    const app = getApp();
    const userInfo = app.globalData.userInfo || {};
    if (!userInfo.openid) {
      wx.showToast({ title: '需要登录才能发布', icon: 'none' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/profile/index' });
      }, 1500);
      return;
    }
    
    // 通过 eventChannel 接收编辑数据
    const eventChannel = this.getOpenerEventChannel();
    eventChannel.on('editData', (data) => {
      if (data.editData) {
        const editData = data.editData;
        this.setData({
          isEdit: true,
          postId: editData.postId,
          identity: editData.identity,
          clubName: editData.clubName,
          content: editData.content,
          imgs: editData.imgs || [],
          originalImgs: editData.imgs || []
        });
      }
    });
  },

  onShow: function () {
    const app = getApp();
    this.setData({ userInfo: app.globalData.userInfo || {} });
  },

  onIdentityChange: function (e) {
    this.setData({ identity: parseInt(e.detail.value) });
  },

  onClubNameInput: function (e) {
    this.setData({ clubName: e.detail.value });
  },

  onContentInput: function (e) {
    this.setData({ content: e.detail.value });
  },

  chooseImage: function () {
    const that = this;
    wx.chooseImage({
      count: 5 - that.data.imgs.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        const tempFilePaths = res.tempFilePaths;
        const currentImgs = that.data.imgs || [];
        
        tempFilePaths.forEach((tempFilePath) => {
          currentImgs.push(tempFilePath);
        });
        
        that.setData({ imgs: currentImgs });
      }
    });
  },

  deleteImage: function (e) {
    const index = e.currentTarget.dataset.index;
    const imgs = this.data.imgs;
    imgs.splice(index, 1);
    this.setData({ imgs });
  },

  submit: function () {
    const that = this;
    const app = getApp();
    const { identity, clubName, content, imgs, isEdit, postId } = this.data;
    
    if (identity === -1) {
      wx.showToast({ title: '请选择身份', icon: 'none' });
      return;
    }
    
    if (!clubName.trim()) {
      wx.showToast({ title: '请输入俱乐部名称', icon: 'none' });
      return;
    }
    
    if (content.length < 10 || content.length > 500) {
      wx.showToast({ title: '内容长度必须在10-500字之间', icon: 'none' });
      return;
    }
    
    if (!imgs || imgs.length === 0) {
      wx.showToast({ title: '请至少上传1张图片', icon: 'none' });
      return;
    }

    if (!app.globalData.userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    that.setData({ loading: true });

    that.compressAndSubmit(identity, clubName, content, imgs, isEdit, postId);
  },

  compressAndSubmit: function (identity, clubName, content, imgs, isEdit, postId) {
    const that = this;
    
    // 直接上传图片，因为 wx.chooseImage 已经设置了 compressed
    that.uploadImagesAndSubmit(identity, clubName, content, imgs, isEdit, postId);
  },

  uploadImagesAndSubmit: function (identity, clubName, content, imgs, isEdit, postId) {
    const that = this;
    const app = getApp();
    const timestamp = Date.now();
    const originalImgs = this.data.originalImgs || [];
    
    const needUpload = (img, index) => {
      if (!isEdit) return true;
      // 临时路径必须上传
      if (img.startsWith('wxfile://')) return true;
      return originalImgs[index] !== img;
    };
    
    const filteredImgs = imgs.filter((img, index) => needUpload(img, index));
    const unchangedImgs = imgs.map((img, index) => needUpload(img, index) ? null : originalImgs[index]).filter(img => img !== null);
    
    if (filteredImgs.length === 0) {
      that.doSubmit(identity, clubName, content, unchangedImgs, isEdit, postId);
      return;
    }
    
    const uploadPromises = filteredImgs.map((img, index) => {
      return new Promise((resolve, reject) => {
        wx.cloud.uploadFile({
          cloudPath: 'posts/' + timestamp + '-' + index + '.png',
          filePath: img,
          success: function (res) {
            resolve(res.fileID);
          },
          fail: function (err) {
            console.error('上传图片失败:', err);
            reject(err);
          }
        });
      });
    });

    Promise.all(uploadPromises).then(uploadedFileIDs => {
      const allImgs = [...unchangedImgs, ...uploadedFileIDs];
      that.doSubmit(identity, clubName, content, allImgs, isEdit, postId);
    }).catch(err => {
      wx.showToast({ title: '图片上传失败，请重试', icon: 'none' });
      that.setData({ loading: false });
    });
  },

  doSubmit: function (identity, clubName, content, imgs, isEdit, postId) {
    const that = this;
    const app = getApp();

    if (isEdit && postId) {
      wx.cloud.callFunction({
        name: 'updatePost',
        data: {
          postId: postId,
          identity: identity,
          clubName: clubName,
          content: content,
          imgs: imgs
        },
        success: function (res) {
          if (res.result.success) {
            wx.showToast({ title: '修改成功，等待审核', icon: 'success' });
            setTimeout(() => {
              wx.reLaunch({ url: '/pages/profile/index' });
            }, 1500);
          } else {
            wx.showToast({ title: res.result.message, icon: 'none' });
          }
          that.setData({ loading: false });
        },
        fail: function (err) {
          console.error('修改失败:', err);
          wx.showToast({ title: '修改失败，请稍后重试', icon: 'none' });
          that.setData({ loading: false });
        }
      });
    } else {
      wx.cloud.callFunction({
        name: 'createPost',
        data: {
          identity: identity,
          clubName: clubName,
          content: content,
          imgs: imgs
        },
        success: function (res) {
          if (res.result.success) {
            wx.showToast({ title: '发布成功，等待审核', icon: 'success' });
            that.setData({
              identity: -1,
              clubName: '',
              content: '',
              imgs: []
            });
            setTimeout(() => {
              wx.reLaunch({ url: '/pages/profile/index' });
            }, 1500);
          } else {
            wx.showToast({ title: res.result.message, icon: 'none' });
          }
          that.setData({ loading: false });
        },
        fail: function (err) {
          console.error('发布失败:', err);
          wx.showToast({ title: '发布失败，请稍后重试', icon: 'none' });
          that.setData({ loading: false });
        }
      });
    }
  }
});
