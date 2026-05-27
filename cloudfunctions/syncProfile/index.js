const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { avatarUrl, nickName } = event;

  if (!nickName || !avatarUrl) {
    return { code: -1, msg: '昵称和头像不能为空' };
  }

  try {
    const profileRes = await db.collection('user_profiles')
      .where({ _openid: OPENID })
      .get();

    const profileData = {
      avatarUrl,
      nickName,
      updatedAt: db.serverDate()
    };

    if (profileRes.data.length > 0) {
      await db.collection('user_profiles')
        .doc(profileRes.data[0]._id)
        .update({ data: profileData });
    } else {
      profileData.createdAt = db.serverDate();
      await db.collection('user_profiles').add({ data: profileData });
    }

    return { code: 0, msg: '同步成功' };
  } catch (err) {
    console.error('syncProfile error:', err);
    return { code: -1, msg: err.message || '同步失败' };
  }
};
