const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { identity, clubName, content, imgs } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;

    const missingFields = [];
    if (identity === undefined || identity === null) missingFields.push('身份');
    if (!clubName) missingFields.push('俱乐部名称');
    if (!content) missingFields.push('内容');
    if (!imgs || imgs.length === 0) missingFields.push('图片');
    
    if (missingFields.length > 0) {
      return {
        success: false,
        message: `缺少必填字段：${missingFields.join('、')}`
      };
    }

    if (content.length < 10 || content.length > 500) {
      return {
        success: false,
        message: '内容长度必须在10-500字之间'
      };
    }

    if (imgs.length > 5) {
      return {
        success: false,
        message: '最多上传5张图片'
      };
    }

    try {
      console.log('开始文字内容安全审核, 内容长度:', content.length);
      const msgSecCheckResult = await cloud.openapi.security.msgSecCheck({
        content: content,
        scene: 3
      });
      console.log('文字内容安全审核结果:', msgSecCheckResult);
      if (msgSecCheckResult && msgSecCheckResult.errcode === 0 && msgSecCheckResult.result && msgSecCheckResult.result.suggest === 'risky') {
        return {
          success: false,
          message: '内容违规，请修改后重新提交'
        };
      }
    } catch (err) {
      console.error('文字内容安全审核失败:', err);
      if (err.errCode === 87014 || err.code === 87014) {
        return {
          success: false,
          message: '内容违规，请修改后重新提交'
        };
      }
    }

    console.log('开始图片内容安全审核, 图片数量:', imgs.length);
    const imgCheckPromises = imgs.map(async (fileID, index) => {
      try {
        const fileResult = await cloud.downloadFile({ fileID });
        const imgSecCheckResult = await cloud.openapi.security.imgSecCheck({
          media: {
            contentType: 'image/png',
            value: fileResult.fileContent
          }
        });
        console.log(`第${index + 1}张图片审核结果:`, imgSecCheckResult);
        if (imgSecCheckResult && imgSecCheckResult.errcode === 0 && imgSecCheckResult.result && imgSecCheckResult.result.suggest === 'risky') {
          return { success: false, index, message: `第${index + 1}张图片违规` };
        }
        return { success: true };
      } catch (err) {
        console.error(`第${index + 1}张图片内容安全审核失败:`, err);
        return { success: true };
      }
    });

    const imgCheckResults = await Promise.all(imgCheckPromises);
    const riskyImg = imgCheckResults.find(r => !r.success);
    if (riskyImg) {
      for (const fileID of imgs) {
        await cloud.deleteFile({ fileList: [fileID] });
      }
      return { success: false, message: riskyImg.message + '，请修改后重新提交' };
    }

    const now = new Date();
    
    const result = await db.collection('posts').add({
      data: {
        _openid: openid,
        identity: identity,
        clubName: clubName,
        content: content,
        imgs: imgs,
        status: 1,
        viewCount: 0,
        usefulCount: 0,
        uselessCount: 0,
        createTime: now,
        updateTime: now
      }
    });

    return {
      success: true,
      message: '帖子发布成功',
      postId: result._id
    };
  } catch (err) {
    console.error('发布帖子失败:', err);
    return {
      success: false,
      message: '发布失败，请稍后重试',
      error: err
    };
  }
};
