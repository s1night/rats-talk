const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { postId, identity, clubName, content, imgs } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    if (!postId) {
      return {
        success: false,
        message: '缺少帖子ID'
      };
    }

    // 检查帖子是否存在且属于当前用户
    const post = await db.collection('posts').doc(postId).get();
    if (!post.data) {
      return {
        success: false,
        message: '帖子不存在'
      };
    }
    if (post.data._openid !== openid) {
      return {
        success: false,
        message: '无权限修改此帖子'
      };
    }

    // 构建更新数据
    const updateData = {
      identity: identity,
      clubName: clubName,
      content: content,
      imgs: imgs,
      status: 0,
      updateTime: db.serverDate()
    };

    // 更新帖子
    const result = await db.collection('posts').doc(postId).update({
      data: updateData
    });

    if (result.stats.updated > 0) {
      return {
        success: true,
        message: '帖子更新成功'
      };
    } else {
      return {
        success: false,
        message: '帖子更新失败'
      };
    }
  } catch (err) {
    console.error('更新帖子失败:', err);
    return {
      success: false,
      message: '更新帖子失败',
      error: err
    };
  }
};
