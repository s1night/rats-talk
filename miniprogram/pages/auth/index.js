// pages/auth/index.js
Page({
  data: {
    avatarUrl: '',
    nickName: ''
  },

  onLoad: function (options) {
    // 页面加载时的逻辑
  },

  onChooseAvatar: function (e) {
    // 选择头像后的回调
    const avatarUrl = e.detail.avatarUrl;
    this.setData({ avatarUrl });
  },

  onNickNameInput: function (e) {
    // 昵称输入
    const nickName = e.detail.value;
    this.setData({ nickName });
  },

  onLogin: function () {
    const { avatarUrl, nickName } = this.data;
    const app = getApp();

    // 分开校验头像和昵称，分开提示用户
    if (!avatarUrl) {
      wx.showToast({ title: '请选择头像', icon: 'none' });
      return;
    }
    if (!nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    // 获取openid
    app.getOpenid((openid) => {
      if (!openid) {
        wx.showToast({ title: '获取用户信息失败', icon: 'none' });
        return;
      }

      // 上传头像到云存储
      this.uploadAvatar(avatarUrl, (avatarFileId) => {
        if (!avatarFileId) {
          wx.showToast({ title: '头像上传失败', icon: 'none' });
          return;
        }

        // 保存用户信息到数据库
        this.saveUserInfo(openid, nickName, avatarFileId, (success) => {
          if (success) {
            // 保存用户信息到本地
            const userInfo = {
              openid: openid,
              nickName: nickName,
              avatarUrl: avatarFileId
            };
            app.saveUserInfoToStorage(userInfo);

            wx.showToast({ title: '登录成功', icon: 'success' });
            setTimeout(() => {
              wx.reLaunch({ url: '/pages/profile/index' });
            }, 1500);
          } else {
            wx.showToast({ title: '登录失败，请重试', icon: 'none' });
          }
        });
      });
    });
  },

  uploadAvatar: function (tempFilePath, callback) {
    const timestamp = Date.now();
    wx.cloud.uploadFile({
      cloudPath: 'avatars/' + timestamp + '.png',
      filePath: tempFilePath,
      success: function (res) {
        callback(res.fileID);
      },
      fail: function (err) {
        console.error('上传头像失败:', err);
        callback(null);
      }
    });
  },

  saveUserInfo: function (openid, nickName, avatarUrl, callback) {
    wx.cloud.callFunction({
      name: 'createUser',
      data: {
        openid: openid,
        nickName: nickName,
        avatarUrl: avatarUrl
      },
      success: function (res) {
        if (res.result.success) {
          callback(true);
        } else {
          callback(false);
        }
      },
      fail: function (err) {
        console.error('保存用户信息失败:', err);
        callback(false);
      }
    });
  }
});