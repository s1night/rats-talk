function formatTime(time) {
  if (!time || time === null || time === undefined || isNaN(new Date(time).getTime())) {
    return '';
  }
  
  const now = new Date();
  const postTime = new Date(time);
  const diff = now - postTime;
  
  // 计算时间差（单位：秒）
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) {
    return '刚刚';
  } else if (seconds < 3600) {
    // 1~59分钟
    const minutes = Math.floor(seconds / 60);
    return minutes + '分钟前';
  } else if (seconds < 86400) {
    // 1~23小时
    const hours = Math.floor(seconds / 3600);
    return hours + '小时前';
  } else if (seconds < 172800) {
    // 1天（24~47小时）
    return '昨天';
  } else if (seconds < 604800) {
    // 2~7天
    const days = Math.floor(seconds / 86400);
    return days + '天前';
  } else if (seconds < 2592000) {
    // 8~30天
    const weeks = Math.floor(seconds / 604800);
    return weeks + '周前';
  } else {
    // 30天以上：展示YYYY-MM-DD
    const year = postTime.getFullYear();
    const month = String(postTime.getMonth() + 1).padStart(2, '0');
    const day = String(postTime.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  }
}

function formatViewCount(count) {
  if (!count || count === null || count === undefined || isNaN(Number(count))) {
    return '0';
  }
  
  const num = Number(count);
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿';
  } else if (num >= 10000000) {
    return (num / 10000000).toFixed(1) + 'kw';
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + 'w';
  } else {
    return num.toString();
  }
}

module.exports = {
  formatTime,
  formatViewCount
};
