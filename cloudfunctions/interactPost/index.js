const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

function normalizeCount(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

exports.main = async (event) => {
  try {
    const { postId, type } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    if (!postId || !type) {
      return { success: false, message: '缺少必要参数' };
    }
    if (!openid) {
      return { success: false, message: '用户未登录' };
    }
    if (type !== 'useful' && type !== 'useless') {
      return { success: false, message: '无效的互动类型' };
    }

    const postRes = await db.collection('posts').doc(postId).get();
    const post = postRes.data;
    if (!post) {
      return { success: false, message: '帖子不存在' };
    }

    const interactionRes = await db.collection('interactions').where({
      postId,
      _openid: openid
    }).limit(1).get();

    const existing = interactionRes.data[0];
    const currentUseful = normalizeCount(post.usefulCount);
    const currentUseless = normalizeCount(post.uselessCount);

    if (!existing) {
      await db.collection('interactions').add({
        data: {
          postId,
          _openid: openid,
          type,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      });

      await db.collection('posts').doc(postId).update({
        data: {
          [`${type}Count`]: normalizeCount(post[`${type}Count`]) + 1
        }
      });

      return { success: true, action: 'add', activeType: type };
    }

    if (existing.type === type) {
      await db.collection('interactions').doc(existing._id).remove();
      await db.collection('posts').doc(postId).update({
        data: {
          [`${type}Count`]: Math.max(0, normalizeCount(post[`${type}Count`]) - 1)
        }
      });

      return { success: true, action: 'cancel', activeType: '' };
    }

    const previousType = existing.type;
    await db.collection('interactions').doc(existing._id).update({
      data: {
        type,
        updateTime: db.serverDate()
      }
    });

    await db.collection('posts').doc(postId).update({
      data: {
        usefulCount: type === 'useful' ? currentUseful + 1 : Math.max(0, currentUseful - 1),
        uselessCount: type === 'useless' ? currentUseless + 1 : Math.max(0, currentUseless - 1)
      }
    });

    return { success: true, action: 'switch', activeType: type, previousType };
  } catch (error) {
    console.error('互动操作失败:', error);
    return {
      success: false,
      message: '互动失败，请稍后重试',
      error
    };
  }
};
