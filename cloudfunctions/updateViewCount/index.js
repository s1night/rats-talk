const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const { postId } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    if (!postId) {
      return {
        success: false,
        message: '缺少帖子ID'
      };
    }

    const post = await db.collection('posts').doc(postId).get();
    if (!post.data) {
      return {
        success: false,
        message: '帖子不存在'
      };
    }

    // 只对已审核通过的帖子增加浏览量
    if (post.data.status !== 1) {
      return {
        success: true,
        message: '帖子未审核通过',
        isNew: false
      };
    }

    // 检查该用户是否已浏览过该帖子
    const viewRecord = await db.collection('views').where({
      postId: postId,
      _openid: openid
    }).get();

    if (viewRecord.data && viewRecord.data.length > 0) {
      // 已浏览过，不重复计数
      return {
        success: true,
        message: '已浏览过',
        isNew: false
      };
    }

    // 记录浏览
    await db.collection('views').add({
      data: {
        postId: postId,
        _openid: openid,
        viewTime: db.serverDate()
      }
    });

    // 更新浏览量
    await db.collection('posts').doc(postId).update({
      data: {
        viewCount: _.inc(1)
      }
    });

    return {
      success: true,
      message: '浏览量更新成功',
      isNew: true
    };
  } catch (err) {
    console.error('更新浏览量失败:', err);
    return {
      success: false,
      message: '更新浏览量失败',
      error: err
    };
  }
};
