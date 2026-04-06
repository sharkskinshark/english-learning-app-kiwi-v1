const crypto = require('node:crypto');

const SESSION_COOKIE_NAME = 'ela_session';
const ONE_DAY_SECONDS = 24 * 60 * 60;
const DEFAULT_SESSION_DAYS = 7;

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + '='.repeat(padLen), 'base64').toString('utf8');
}

function getSessionSecret() {
  const secret = process.env.APP_SESSION_SECRET || '';
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing APP_SESSION_SECRET environment variable.');
  }
  return 'local-dev-secret-change-me';
}

function signPayload(payloadBase64) {
  const hmac = crypto.createHmac('sha256', getSessionSecret());
  hmac.update(payloadBase64);
  const digest = hmac.digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return digest;
}

function parseCookies(req) {
  const header = req.headers?.cookie || '';
  const pairs = header.split(';').map((part) => part.trim()).filter(Boolean);
  const out = {};
  pairs.forEach((pair) => {
    const index = pair.indexOf('=');
    if (index <= 0) return;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    out[key] = decodeURIComponent(value);
  });
  return out;
}

function createSessionToken(payload) {
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadBase64, signature] = token.split('.');
  if (!payloadBase64 || !signature) return null;

  const expected = signPayload(payloadBase64);
  const sigA = Buffer.from(signature);
  const sigB = Buffer.from(expected);
  if (sigA.length !== sigB.length) return null;
  if (!crypto.timingSafeEqual(sigA, sigB)) return null;

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(payloadBase64));
  } catch {
    return null;
  }

  if (!payload || typeof payload !== 'object') return null;
  const exp = Number(payload.exp || 0);
  if (!Number.isFinite(exp) || exp <= Date.now()) return null;

  return payload;
}

function issueSessionCookie(res, user) {
  const expiresAt = Date.now() + DEFAULT_SESSION_DAYS * ONE_DAY_SECONDS * 1000;
  const payload = {
    uid: Number(user.id),
    sub: String(user.google_sub || ''),
    email: String(user.email || ''),
    name: String(user.name || ''),
    exp: expiresAt
  };

  const token = createSessionToken(payload);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const cookie = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${DEFAULT_SESSION_DAYS * ONE_DAY_SECONDS}`,
    secure
  ].join('; ');

  res.setHeader('Set-Cookie', cookie);
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const cookie = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    secure
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE_NAME] || '';
  return verifySessionToken(token);
}

module.exports = {
  parseCookies,
  issueSessionCookie,
  clearSessionCookie,
  getSessionFromRequest
};
