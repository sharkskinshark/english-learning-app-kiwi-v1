const { getSessionFromRequest } = require('./session.js');
const { ensureSchema, getUserById } = require('./db.js');

async function requireUser(req) {
  const session = getSessionFromRequest(req);
  if (!session?.uid) return null;

  await ensureSchema();
  return await getUserById(session.uid);
}

module.exports = {
  requireUser
};
