const { sendJson, methodNotAllowed, readJsonBody } = require('../_lib/http.js');
const { verifyGoogleIdToken } = require('../_lib/google.js');
const { ensureSchema, upsertUserFromGoogle } = require('../_lib/db.js');
const { issueSessionCookie } = require('../_lib/session.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const body = await readJsonBody(req);
    const idToken = typeof body?.idToken === 'string' ? body.idToken.trim() : '';
    if (!idToken) return sendJson(res, 400, { error: 'Missing idToken.' });

    const googleProfile = await verifyGoogleIdToken(idToken);
    if (!googleProfile.emailVerified) {
      return sendJson(res, 403, { error: 'Google account email is not verified.' });
    }

    await ensureSchema();
    const user = await upsertUserFromGoogle(googleProfile);
    issueSessionCookie(res, user);

    return sendJson(res, 200, {
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatar_url || ''
      }
    });
  } catch (error) {
    return sendJson(res, 500, {
      error: error?.message || 'Google login failed.'
    });
  }
};
