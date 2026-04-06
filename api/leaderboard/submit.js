const { sendJson, methodNotAllowed, readJsonBody } = require('../_lib/http.js');
const { requireUser } = require('../_lib/auth-required.js');
const { isValidLeaderboardType, upsertLeaderboardBest } = require('../_lib/db.js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const user = await requireUser(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized.' });

    const body = await readJsonBody(req);
    const boardType = String(body?.boardType || '').trim();
    const score = Number(body?.score);
    const details = body?.details;

    if (!isValidLeaderboardType(boardType)) {
      return sendJson(res, 400, { error: 'Invalid leaderboard type.' });
    }

    if (!Number.isFinite(score)) {
      return sendJson(res, 400, { error: 'Invalid score.' });
    }

    const row = await upsertLeaderboardBest(user.id, boardType, score, details);
    return sendJson(res, 200, {
      ok: true,
      entry: {
        boardType: row?.board_type || boardType,
        bestScore: Number(row?.best_score || 0),
        lastScore: Number(row?.last_score || score),
        updatedAt: row?.updated_at || new Date().toISOString()
      }
    });
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'Failed to update leaderboard.' });
  }
};
