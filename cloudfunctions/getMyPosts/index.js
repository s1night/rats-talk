const cloud = require('wx-server-sdk');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const { page = 1, pageSize = 10 } = event;
    const skip = (page - 1) * pageSize;

    // 查询用户发布的帖子
    const posts = await db.collection('posts')
      .where({ _openid: openid })
      .orderBy('updateTime', 'desc')
      .skip(skip)
      .limit(pageSize)
      .get();

    const postIds = posts.data.map((item) => item._id);
    let interactionMap = {};
    if (postIds.length > 0) {
      const interactionResult = await db.collection('interactions').where({
        _openid: openid,
        postId: db.command.in(postIds)
      }).get();
      interactionMap = interactionResult.data.reduce((acc, item) => {
        acc[item.postId] = item.type;
        return acc;
      }, {});
    }

    // 直接返回原文件地址，不转换为临时链接
    const postsWithTempUrls = posts.data.map((item) => ({
      ...item,
      usefulCount: Number(item.usefulCount || 0),
      uselessCount: Number(item.uselessCount || 0),
      userInteractionType: interactionMap[item._id] || ''
    }));

    // 获取总数
    const countResult = await db.collection('posts')
      .where({ _openid: openid })
      .count();

    return {
      success: true,
      data: {
        posts: postsWithTempUrls,
        total: countResult.total,
        page: page,
        pageSize: pageSize
      }
    };
  } catch (err) {
    console.error('获取我的发布失败:', err);
    return {
      success: false,
      message: '获取我的发布失败',
      error: err
    };
  }
};