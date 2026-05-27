const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { rangeType, startDate, endDate } = event;

  try {
    let startTs = 0;
    let endTs = Date.now();
    const now = new Date();

    if (rangeType === 'week') {
      startTs = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6).getTime();
    } else if (rangeType === 'month') {
      startTs = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29).getTime();
    } else if (rangeType === 'custom' && startDate && endDate) {
      startTs = new Date(`${startDate}T00:00:00`).getTime();
      endTs = new Date(`${endDate}T23:59:59`).getTime();
    }

    const recordsRes = await db.collection('poop_records')
      .where({
        timestamp: _.gte(startTs).and(_.lte(endTs))
      })
      .limit(1000)
      .get();

    const records = recordsRes.data;

    const userCountMap = {};
    const userList = [];
    records.forEach(r => {
      const uid = r._openid || 'anonymous';
      if (!userCountMap[uid]) {
        userCountMap[uid] = { _openid: uid, count: 0 };
        userList.push(userCountMap[uid]);
      }
      userCountMap[uid].count++;
    });

    userList.sort((a, b) => b.count - a.count);

    const profilesRes = await db.collection('user_profiles')
      .where({
        _openid: _.in(userList.map(u => u._openid))
      })
      .get();

    const profileMap = {};
    profilesRes.data.forEach(p => {
      profileMap[p._openid] = p;
    });

    const result = userList.map((u, index) => ({
      rank: index + 1,
      openid: u._openid,
      count: u.count,
      nickName: (profileMap[u._openid] && profileMap[u._openid].nickName) || '匿名拉翔官',
      avatarUrl: (profileMap[u._openid] && profileMap[u._openid].avatarUrl) ||
        'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2UTgVYia8icgZCOfMTNeyFscD6v1ic0Z6WclL8XQX5C7Uu6TOfg/0'
    }));

    return { code: 0, data: result };
  } catch (err) {
    console.error('getLeaderboard error:', err);
    return { code: -1, msg: err.message || '获取排行榜失败' };
  }
};
