# MVP Backend Setup (Google Auth + Account Cloud Sync)

This app now supports two sync modes:

1. Account cloud sync (recommended): Google sign-in + backend API + database.
2. GitHub sync (fallback): existing owner/repo/token workflow.

## 1) Vercel Integrations

In Vercel project settings, connect:

1. Neon Postgres (or Vercel Postgres migration target).
2. Google OAuth client (from Google Cloud Console).

## 2) Required Environment Variables

Set these in Vercel Project -> Settings -> Environment Variables:

1. GOOGLE_CLIENT_ID
2. APP_SESSION_SECRET
3. POSTGRES_URL (or the connection string injected by your Postgres integration)

Notes:

1. APP_SESSION_SECRET should be a long random string (32+ chars).
2. For local dev, place the same keys in .env.local.

## 3) Google OAuth Configuration

In Google Cloud Console:

1. Create OAuth 2.0 Client ID (Web application).
2. Add authorized JavaScript origins:
   - https://your-production-domain
   - http://localhost:3000 (or local dev port)
3. No client secret is needed in frontend. The frontend sends ID token to backend for verification.

## 4) Deploy

1. Push current branch to GitHub.
2. Vercel auto-deploys.
3. Open app and use Profile & Cloud Sync section:
   - Sign in with Google
   - Upload/Download buttons now point to account cloud

## 5) API Endpoints Added

1. GET /api/auth/config
2. POST /api/auth/google-login
3. GET /api/auth/session
4. POST /api/auth/logout
5. GET /api/sync/pull
6. POST /api/sync/push

## 6) Behavior Summary

1. If Google backend is configured and user is signed in:
   - Upload/Download use account cloud.
2. If not signed in (or backend not configured):
   - Upload/Download use existing GitHub sync mode.

This keeps review, dashboard, upload, and download flows available while migrating to backend-first sync.

## 7) 30-Minute Quick Runbook

Follow this exact order for the fastest rollout:

1. In Vercel, add env vars:
   - GOOGLE_CLIENT_ID
   - APP_SESSION_SECRET
   - POSTGRES_URL
2. In Google Cloud Console, add your production domain to Authorized JavaScript origins.
3. Push code to main.
4. Wait for Vercel deployment to become Ready.
5. Open production URL and test sign-in + upload + download.

If any step fails, do not skip ahead. Fix that step first.

## 8) Production Verification Checklist

### A. Backend Health

1. Open /api/auth/config and confirm:
   - backendEnabled is true
   - googleClientId is non-empty
2. Open app homepage and confirm auth hint is not showing backend unavailable.

### B. Google Sign-In Flow

1. Click Google sign-in.
2. Confirm hint changes to signed-in status.
3. Confirm Sign Out button appears.

Expected result:

1. Sync buttons text switches to:
   - Download from Account
   - Upload to Account

### C. Upload and Download Flow

1. Make a small progress change (practice a few words).
2. Click Upload to Account.
3. Refresh page.
4. Click Download from Account.

Expected result:

1. Progress/review/dashboard data restores correctly.
2. No token prompt is needed in account mode.

### D. Fallback Safety (GitHub Mode)

1. Click Sign Out.
2. Confirm sync buttons switch back to GitHub labels.
3. Confirm existing GitHub upload/download still works when token is provided.

Expected result:

1. review, dashboard, upload, download remain usable in fallback mode.

### E. Session Expiry Behavior

1. Clear cookies or wait for session expiry.
2. Click Upload/Download in account mode.

Expected result:

1. UI prompts user to sign in again.
2. App does not crash and can continue in GitHub mode.

## 9) Quick Troubleshooting

1. backendEnabled is false:
   - GOOGLE_CLIENT_ID missing or not applied to this Vercel environment.
2. Google sign-in popup works but login fails:
   - Authorized origin mismatch in Google Cloud Console.
3. Login succeeds but upload/download returns 500:
   - POSTGRES_URL missing or invalid.
4. Login succeeds but session is immediately lost:
   - APP_SESSION_SECRET missing in production.
