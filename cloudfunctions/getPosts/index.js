const cloud = require('wx-server-sdk');

// 初始化云开发
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    const { clubName, page = 1, pageSize = 10, postId } = event;
    const skip = (page - 1) * pageSize;

    // 如果有postId，获取单个帖子详情
    if (postId) {
      const post = await db.collection('posts').doc(postId).get();
      
      if (!post.data) {
        return {
          success: false,
          message: '帖子不存在'
        };
      }

      // 关联用户信息
      let userInfo = null;
      try {
        const userResult = await db.collection('users').where({
          _openid: post.data._openid
        }).get();
        userInfo = userResult.data[0] || null;
      } catch (e) {
        // 用户信息查询失败
      }

      const interactionResult = await db.collection('interactions').where({
        postId: post.data._id,
        _openid: openid
      }).limit(1).get();

      const postData = {
        ...post.data,
        nickName: userInfo ? userInfo.nickName : '匿名用户',
        avatarUrl: userInfo ? userInfo.avatarUrl : '',
        userInteractionType: interactionResult.data[0] ? interactionResult.data[0].type : ''
      };

      // 直接返回原文件地址，不转换为临时链接
      // 转换头像为临时链接
      if (postData.avatarUrl && postData.avatarUrl.startsWith('cloud://')) {
        try {
          const tempFileResult = await cloud.getTempFileURL({
            fileList: [postData.avatarUrl]
          });
          if (tempFileResult.fileList[0].tempFileURL) {
            postData.avatarUrl = tempFileResult.fileList[0].tempFileURL;
          }
        } catch (e) {
          console.error('获取头像临时链接失败:', e);
        }
      }

      return {
        success: true,
        data: {
          posts: [postData]
        }
      };
    }

    // 构建查询条件
    let matchCondition = { status: 1 }; // 只获取已通过审核的帖子
    if (clubName) {
      matchCondition.clubName = db.RegExp({
        regexp: clubName,
        options: 'i'
      });
    }

    // 聚合查询，关联用户数据
    const posts = await db.collection('posts')
      .aggregate()
      .match(matchCondition)
      .sort({ createTime: -1 }) // 首页使用 createTime 排序
      .skip(skip)
      .limit(pageSize)
      .lookup({
        from: 'users',
        localField: '_openid',
        foreignField: '_openid',
        as: 'userInfo'
      })
      .unwind('$userInfo')
      .project({
        _id: 1,
        _openid: 1,
        identity: 1,
        clubName: 1,
        content: 1,
        imgs: 1,
        viewCount: 1,
        usefulCount: 1,
        uselessCount: 1,
        createTime: 1,
        updateTime: 1,
        nickName: '$userInfo.nickName',
        avatarUrl: '$userInfo.avatarUrl'
      })
      .end();

    // 直接返回原文件地址，不转换为临时链接
    const postIds = posts.list.map((item) => item._id);
    let interactionMap = {};
    if (postIds.length > 0) {
      const interactionsResult = await db.collection('interactions').where({
        _openid: openid,
        postId: _.in(postIds)
      }).get();
      interactionMap = interactionsResult.data.reduce((acc, item) => {
        acc[item.postId] = item.type;
        return acc;
      }, {});
    }

    const postsWithTempUrls = await Promise.all(posts.list.map(async (post) => {
      // 用户头像需要转换
      if (post.avatarUrl && post.avatarUrl.startsWith('cloud://')) {
        try {
          const tempFileResult = await cloud.getTempFileURL({
            fileList: [post.avatarUrl]
          });
          if (tempFileResult.fileList[0].tempFileURL) {
            post.avatarUrl = tempFileResult.fileList[0].tempFileURL;
          }
        } catch (e) {
          console.error('获取头像临时链接失败:', e);
        }
      }
      return {
        ...post,
        userInteractionType: interactionMap[post._id] || ''
      };
    }));

    // 获取总数
    let total = 0;
    if (clubName) {
      const countResult = await db.collection('posts').where({
        status: 1,
        clubName: clubName
      }).count();
      total = countResult.total;
    } else {
      const countResult = await db.collection('posts').where({
        status: 1
      }).count();
      total = countResult.total;
    }

    return {
      success: true,
      data: {
        posts: postsWithTempUrls,
        total: total,
        page: page,
        pageSize: pageSize
      }
    };
  } catch (err) {
    console.error('获取帖子列表失败:', err);
    return {
      success: false,
      message: '获取帖子列表失败',
      error: err
    };
  }
};
