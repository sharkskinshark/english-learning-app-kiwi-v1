const { sendJson, methodNotAllowed } = require('../_lib/http.js');
const { clearSessionCookie } = require('../_lib/session.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  clearSessionCookie(res);
  return sendJson(res, 200, { ok: true });
};
