const { sql } = require('@vercel/postgres');

let schemaReady = false;
const ALLOWED_LEADERBOARD_TYPES = ['dailyStreak', 'wordsLearned', 'eventPoints', 'perfectScores'];

function isValidLeaderboardType(type) {
  return ALLOWED_LEADERBOARD_TYPES.includes(String(type || ''));
}

async function ensureSchema() {
  if (schemaReady) return;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      google_sub TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      avatar_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_state (
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS leaderboard_best (
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      board_type TEXT NOT NULL,
      best_score DOUBLE PRECISION NOT NULL DEFAULT 0,
      last_score DOUBLE PRECISION NOT NULL DEFAULT 0,
      details_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, board_type)
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS leaderboard_best_type_score_idx
    ON leaderboard_best (board_type, best_score DESC, updated_at ASC);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS identity_profiles (
      user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      nickname TEXT NOT NULL,
      nickname_key TEXT UNIQUE NOT NULL,
      birthday TEXT NOT NULL,
      google_email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS identity_profiles_birthday_idx
    ON identity_profiles (birthday);
  `;

  schemaReady = true;
}

async function getIdentityProfileByUserId(userId) {
  const rows = await sql`
    SELECT user_id, nickname, nickname_key, birthday, google_email, created_at, updated_at
    FROM identity_profiles
    WHERE user_id = ${Number(userId)}
    LIMIT 1;
  `;
  return rows.rows[0] || null;
}

async function findIdentityProfileByNicknameKey(nicknameKey) {
  const rows = await sql`
    SELECT user_id, nickname, nickname_key, birthday, google_email, created_at, updated_at
    FROM identity_profiles
    WHERE nickname_key = ${String(nicknameKey || '')}
    LIMIT 1;
  `;
  return rows.rows[0] || null;
}

async function findIdentityProfileByGoogleEmail(googleEmail) {
  const rows = await sql`
    SELECT user_id, nickname, nickname_key, birthday, google_email, created_at, updated_at
    FROM identity_profiles
    WHERE google_email = ${String(googleEmail || '')}
    LIMIT 1;
  `;
  return rows.rows[0] || null;
}

async function registerOrValidateIdentityProfile({ userId, nickname, birthday, googleEmail }) {
  const uid = Number(userId);
  const safeNickname = String(nickname || '').trim();
  const nicknameKey = safeNickname.toLowerCase();
  const safeBirthday = String(birthday || '').trim();
  const safeEmail = String(googleEmail || '').trim().toLowerCase();

  if (!uid || !safeNickname || !nicknameKey || !safeBirthday || !safeEmail) {
    throw new Error('Missing required identity fields.');
  }

  const current = await getIdentityProfileByUserId(uid);
  const byNickname = await findIdentityProfileByNicknameKey(nicknameKey);
  const byEmail = await findIdentityProfileByGoogleEmail(safeEmail);

  if (byNickname && Number(byNickname.user_id) !== uid) {
    return { ok: false, reason: 'nickname-taken' };
  }

  if (byEmail && Number(byEmail.user_id) !== uid) {
    return { ok: false, reason: 'email-taken' };
  }

  if (current) {
    if (current.nickname_key !== nicknameKey) {
      return { ok: false, reason: 'nickname-mismatch', profile: current };
    }
    if (current.google_email !== safeEmail) {
      return { ok: false, reason: 'email-mismatch', profile: current };
    }
    if (current.birthday !== safeBirthday) {
      return { ok: false, reason: 'birthday-mismatch', profile: current };
    }

    const rows = await sql`
      UPDATE identity_profiles
      SET nickname = ${safeNickname}, updated_at = NOW()
      WHERE user_id = ${uid}
      RETURNING user_id, nickname, nickname_key, birthday, google_email, created_at, updated_at;
    `;
    return { ok: true, created: false, profile: rows.rows[0] || current };
  }

  try {
    const rows = await sql`
      INSERT INTO identity_profiles (user_id, nickname, nickname_key, birthday, google_email, created_at, updated_at)
      VALUES (${uid}, ${safeNickname}, ${nicknameKey}, ${safeBirthday}, ${safeEmail}, NOW(), NOW())
      RETURNING user_id, nickname, nickname_key, birthday, google_email, created_at, updated_at;
    `;
    return { ok: true, created: true, profile: rows.rows[0] || null };
  } catch (error) {
    const msg = String(error?.message || '').toLowerCase();
    if (error?.code === '23505' || msg.includes('duplicate key')) {
      if (msg.includes('nickname_key')) return { ok: false, reason: 'nickname-taken' };
      if (msg.includes('google_email')) return { ok: false, reason: 'email-taken' };
      return { ok: false, reason: 'identity-conflict' };
    }
    throw error;
  }
}

async function upsertUserFromGoogle(profile) {
  const rows = await sql`
    INSERT INTO users (google_sub, email, name, avatar_url, updated_at)
    VALUES (${profile.sub}, ${profile.email}, ${profile.name || ''}, ${profile.picture || ''}, NOW())
    ON CONFLICT (google_sub)
    DO UPDATE SET
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = NOW()
    RETURNING id, google_sub, email, name, avatar_url, created_at, updated_at;
  `;

  return rows.rows[0];
}

async function getUserById(id) {
  const rows = await sql`
    SELECT id, google_sub, email, name, avatar_url, created_at, updated_at
    FROM users
    WHERE id = ${Number(id)}
    LIMIT 1;
  `;
  return rows.rows[0] || null;
}

async function pullUserState(userId) {
  const rows = await sql`
    SELECT state_json, updated_at
    FROM user_state
    WHERE user_id = ${Number(userId)}
    LIMIT 1;
  `;
  return rows.rows[0] || null;
}

async function pushUserState(userId, payload) {
  const rows = await sql`
    INSERT INTO user_state (user_id, state_json, updated_at)
    VALUES (${Number(userId)}, ${JSON.stringify(payload)}, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      state_json = EXCLUDED.state_json,
      updated_at = NOW()
    RETURNING updated_at;
  `;
  return rows.rows[0] || null;
}

async function upsertLeaderboardBest(userId, boardType, score, details = {}) {
  if (!isValidLeaderboardType(boardType)) {
    throw new Error('Invalid leaderboard type.');
  }

  const numericScore = Number(score);
  if (!Number.isFinite(numericScore)) {
    throw new Error('Score must be a finite number.');
  }

  const safeDetails = (details && typeof details === 'object' && !Array.isArray(details)) ? details : {};

  const rows = await sql`
    INSERT INTO leaderboard_best (user_id, board_type, best_score, last_score, details_json, updated_at)
    VALUES (${Number(userId)}, ${String(boardType)}, ${numericScore}, ${numericScore}, ${JSON.stringify(safeDetails)}, NOW())
    ON CONFLICT (user_id, board_type)
    DO UPDATE SET
      best_score = GREATEST(leaderboard_best.best_score, EXCLUDED.best_score),
      last_score = EXCLUDED.last_score,
      details_json = CASE
        WHEN EXCLUDED.best_score >= leaderboard_best.best_score THEN EXCLUDED.details_json
        ELSE leaderboard_best.details_json
      END,
      updated_at = NOW()
    RETURNING user_id, board_type, best_score, last_score, details_json, updated_at;
  `;

  return rows.rows[0] || null;
}

async function listLeaderboardByType(boardType, limit = 20) {
  if (!isValidLeaderboardType(boardType)) {
    throw new Error('Invalid leaderboard type.');
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
  const rows = await sql`
    SELECT
      lb.user_id,
      lb.board_type,
      lb.best_score,
      lb.last_score,
      lb.details_json,
      lb.updated_at,
      u.name,
      u.email
    FROM leaderboard_best lb
    JOIN users u ON u.id = lb.user_id
    WHERE lb.board_type = ${String(boardType)}
    ORDER BY lb.best_score DESC, lb.updated_at ASC
    LIMIT ${safeLimit};
  `;

  return rows.rows || [];
}

module.exports = {
  ensureSchema,
  upsertUserFromGoogle,
  getUserById,
  getIdentityProfileByUserId,
  findIdentityProfileByNicknameKey,
  findIdentityProfileByGoogleEmail,
  registerOrValidateIdentityProfile,
  pullUserState,
  pushUserState,
  ALLOWED_LEADERBOARD_TYPES,
  isValidLeaderboardType,
  upsertLeaderboardBest,
  listLeaderboardByType
};
