const { sendJson, methodNotAllowed, readJsonBody } = require('../_lib/http.js');
const { requireUser } = require('../_lib/auth-required.js');
const { pushUserState } = require('../_lib/db.js');

const MAX_PAYLOAD_BYTES = 1_500_000;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const user = await requireUser(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized.' });

    const body = await readJsonBody(req);
    const payload = body?.payload;

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return sendJson(res, 400, { error: 'Invalid payload.' });
    }

    const serialized = JSON.stringify(payload);
    if (Buffer.byteLength(serialized, 'utf8') > MAX_PAYLOAD_BYTES) {
      return sendJson(res, 413, { error: 'Payload too large.' });
    }

    const row = await pushUserState(user.id, payload);
    return sendJson(res, 200, { ok: true, updatedAt: row?.updated_at || new Date().toISOString() });
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'Failed to push cloud state.' });
  }
};
