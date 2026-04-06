const { sendJson, methodNotAllowed, readJsonBody } = require('../_lib/http.js');
const { getSessionFromRequest } = require('../_lib/session.js');
const {
  ensureSchema,
  getUserById,
  getIdentityProfileByUserId,
  findIdentityProfileByNicknameKey,
  registerOrValidateIdentityProfile
} = require('../_lib/db.js');

function isValidBirthday(value) {
  if (!/^\d{8}$/.test(value || '')) return false;

  const yyyy = parseInt(value.slice(0, 4), 10);
  const mm = parseInt(value.slice(4, 6), 10);
  const dd = parseInt(value.slice(6, 8), 10);
  const date = new Date(yyyy, mm - 1, dd);

  if (yyyy < 1900 || yyyy > 2100) return false;
  return date.getFullYear() === yyyy && date.getMonth() === mm - 1 && date.getDate() === dd;
}

function serializeIdentityProfile(profile) {
  if (!profile) return null;
  return {
    nickname: profile.nickname,
    birthday: profile.birthday,
    googleEmail: profile.google_email,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return methodNotAllowed(res, ['GET', 'POST']);
  }

  try {
    const session = getSessionFromRequest(req);
    const userId = Number(session?.uid || 0);

    if (!userId) {
      return sendJson(res, 200, { authenticated: false, user: null });
    }

    await ensureSchema();
    const user = await getUserById(userId);
    if (!user) {
      return sendJson(res, 200, { authenticated: false, user: null });
    }

    if (req.method === 'GET') {
      const identityProfile = await getIdentityProfileByUserId(user.id);
      return sendJson(res, 200, {
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatar_url || ''
        },
        identityProfile: serializeIdentityProfile(identityProfile)
      });
    }

    const body = await readJsonBody(req);
    const action = typeof body?.action === 'string' ? body.action.trim().toLowerCase() : '';

    if (action === 'me') {
      const profile = await getIdentityProfileByUserId(user.id);
      return sendJson(res, 200, { ok: true, profile: serializeIdentityProfile(profile) });
    }

    const nickname = typeof body?.nickname === 'string' ? body.nickname.trim() : '';
    const birthday = typeof body?.birthday === 'string' ? body.birthday.trim() : '';

    if (!nickname) {
      return sendJson(res, 400, { error: 'Missing nickname.', reason: 'missing-nickname' });
    }
    if (!isValidBirthday(birthday)) {
      return sendJson(res, 400, { error: 'Invalid birthday format.', reason: 'invalid-birthday' });
    }

    if (action === 'register') {
      const result = await registerOrValidateIdentityProfile({
        userId: user.id,
        nickname,
        birthday,
        googleEmail: user.email
      });

      if (!result?.ok) {
        const reason = result?.reason || 'identity-conflict';
        const reasonMessageMap = {
          'nickname-taken': '此暱稱已被其他人註冊。',
          'email-taken': '此 Gmail 已綁定其他帳號。',
          'nickname-mismatch': '此 Gmail 已綁定其他暱稱，無法更換。',
          'email-mismatch': '此暱稱已綁定其他 Gmail，無法更換。',
          'birthday-mismatch': '此暱稱的生日不一致。請輸入原本生日。',
          'identity-conflict': '身份資料衝突，請確認暱稱、生日與 Gmail 是否一致。'
        };

        return sendJson(res, 409, {
          error: reasonMessageMap[reason] || reasonMessageMap['identity-conflict'],
          reason
        });
      }

      return sendJson(res, 200, {
        ok: true,
        created: !!result.created,
        profile: serializeIdentityProfile(result.profile)
      });
    }

    if (action === 'check') {
      const profile = await findIdentityProfileByNicknameKey(nickname.toLowerCase());
      if (!profile) {
        return sendJson(res, 200, { registered: false, owner: false, reason: 'not-found', profile: null });
      }

      if (profile.birthday !== birthday) {
        return sendJson(res, 200, { registered: false, owner: false, reason: 'birthday-mismatch', profile: null });
      }

      const owner = Number(profile.user_id) === Number(user.id);
      return sendJson(res, 200, {
        registered: true,
        owner,
        reason: owner ? 'owned-by-current-user' : 'owned-by-other-user',
        profile: owner ? serializeIdentityProfile(profile) : null
      });
    }

    return sendJson(res, 400, { error: 'Unsupported action.', reason: 'unsupported-action' });
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'Failed to read session.' });
  }
};
