const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { openid, nickName, avatarUrl } = event;

    if (!openid || !nickName || !avatarUrl) {
      return {
        success: false,
        message: '缺少必要参数'
      };
    }

    // 检查用户是否已存在
    let user = await db.collection('users').where({ _openid: openid }).get();
    
    if (user.data.length > 0) {
      // 更新用户信息
      await db.collection('users').where({ _openid: openid }).update({
        data: {
          nickName: nickName,
          avatarUrl: avatarUrl,
          updateTime: new Date()
        }
      });
    } else {
      // 创建新用户
      await db.collection('users').add({
        data: {
          _openid: openid,
          nickName: nickName,
          avatarUrl: avatarUrl,
          createTime: new Date(),
          updateTime: new Date()
        }
      });
    }

    return {
      success: true,
      message: '用户信息保存成功'
    };
  } catch (err) {
    console.error('保存用户信息失败:', err);
    return {
      success: false,
      message: '保存用户信息失败',
      error: err
    };
  }
};