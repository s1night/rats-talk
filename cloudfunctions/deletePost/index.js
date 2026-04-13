const cloud = require('wx-server-sdk');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { postId } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    // 验证必填字段
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
        message: '无权限删除此帖子'
      };
    }

    // 删除帖子
    await db.collection('posts').doc(postId).remove();

    return {
      success: true,
      message: '帖子删除成功'
    };
  } catch (err) {
    console.error('删除帖子失败:', err);
    return {
      success: false,
      message: '删除失败，请稍后重试',
      error: err
    };
  }
};