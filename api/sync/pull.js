const { sendJson, methodNotAllowed } = require('../_lib/http.js');
const { requireUser } = require('../_lib/auth-required.js');
const { pullUserState } = require('../_lib/db.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const user = await requireUser(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized.' });

    const state = await pullUserState(user.id);
    if (!state) {
      return sendJson(res, 200, { payload: null, updatedAt: null });
    }

    return sendJson(res, 200, {
      payload: state.state_json,
      updatedAt: state.updated_at
    });
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'Failed to pull cloud state.' });
  }
};
