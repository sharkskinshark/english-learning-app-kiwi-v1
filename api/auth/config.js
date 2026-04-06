const { sendJson, methodNotAllowed } = require('../_lib/http.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
  const backendEnabled = !!googleClientId;

  return sendJson(res, 200, {
    backendEnabled,
    googleClientId: backendEnabled ? googleClientId : ''
  });
};
