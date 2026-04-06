const { sendJson, methodNotAllowed } = require('../_lib/http.js');
const { requireUser } = require('../_lib/auth-required.js');
const { ALLOWED_LEADERBOARD_TYPES, isValidLeaderboardType, listLeaderboardByType } = require('../_lib/db.js');

const ADMIN_EMAIL = 'sharkskinshark@gmail.com';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function getQueryValue(req, key) {
  if (req?.query && typeof req.query[key] !== 'undefined') {
    return req.query[key];
  }

  try {
    const url = new URL(req.url, 'http://localhost');
    return url.searchParams.get(key);
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const user = await requireUser(req);
    if (!user) return sendJson(res, 401, { error: 'Unauthorized.' });

    const viewerEmail = normalizeEmail(user.email);
    const isAdminViewer = viewerEmail === ADMIN_EMAIL;

    const boardTypeRaw = String(getQueryValue(req, 'boardType') || '').trim();
    const limitRaw = Number(getQueryValue(req, 'limit'));
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

    const targetTypes = (!boardTypeRaw || boardTypeRaw === 'all')
      ? ALLOWED_LEADERBOARD_TYPES
      : (isValidLeaderboardType(boardTypeRaw) ? [boardTypeRaw] : null);

    if (!targetTypes) {
      return sendJson(res, 400, { error: 'Invalid leaderboard type.' });
    }

    const types = {};
    for (const type of targetTypes) {
      const fetchLimit = isAdminViewer ? limit : Math.min(limit + 10, 100);
      const rows = await listLeaderboardByType(type, fetchLimit);
      const visibleRows = isAdminViewer
        ? rows
        : rows.filter((row) => normalizeEmail(row.email) !== ADMIN_EMAIL);

      types[type] = visibleRows.slice(0, limit).map((row, index) => ({
        rank: index + 1,
        userId: Number(row.user_id),
        username: row.name || row.email || 'Anonymous',
        email: row.email || '',
        bestScore: Number(row.best_score || 0),
        lastScore: Number(row.last_score || 0),
        details: row.details_json || {},
        updatedAt: row.updated_at || null
      }));
    }

    return sendJson(res, 200, {
      ok: true,
      currentUser: {
        id: Number(user.id),
        email: user.email || '',
        name: user.name || ''
      },
      types
    });
  } catch (error) {
    return sendJson(res, 500, { error: error?.message || 'Failed to load leaderboards.' });
  }
};
