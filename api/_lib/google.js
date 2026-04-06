async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Missing Google ID token.');
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!response.ok) {
    throw new Error('Google token verification failed.');
  }

  const payload = await response.json();
  const expectedAud = process.env.GOOGLE_CLIENT_ID || '';
  if (!expectedAud) {
    throw new Error('Missing GOOGLE_CLIENT_ID environment variable.');
  }

  if (!payload || payload.aud !== expectedAud) {
    throw new Error('Google token audience mismatch.');
  }

  if (!payload.sub || !payload.email) {
    throw new Error('Google token payload is incomplete.');
  }

  return {
    sub: String(payload.sub),
    email: String(payload.email),
    name: String(payload.name || ''),
    picture: String(payload.picture || ''),
    emailVerified: payload.email_verified === 'true' || payload.email_verified === true
  };
}

module.exports = {
  verifyGoogleIdToken
};
