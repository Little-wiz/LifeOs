# Deploying LifeOS to Vercel

Your client and server are separate apps, so they become **two separate
Vercel projects**. Deploy the server first — the client needs its real
URL.

Two small fixes are included in this update before you deploy:

- `server/src/index.js` now also `export default app` (in addition to
  `app.listen()`). Vercel's current Express support (confirmed against
  their docs as of May 2026) accepts either pattern — exporting too
  just removes any ambiguity.
- `server/vercel.json` has been **deleted**. The old version used the
  legacy `builds`/`routes` format, which opts out of Vercel's modern
  zero-config Express detection. Your server file is already in a
  supported location (`src/index.js`), so no config file is needed —
  delete it from your local copy too.

---

## Step 1 — Push your latest code to GitHub

Vercel deploys from a Git repo. If you haven't already, commit and push
(your `.env` files are already gitignored, so secrets won't leak).

## Step 2 — Deploy the server

1. In the Vercel dashboard: **New Project → Import** your repo.
2. **Root Directory:** `server`
3. Framework preset: leave as auto-detected (Vercel will detect Express).
4. Before deploying, add these **Environment Variables**:

   | Key | Value |
   |---|---|
   | `AWS_ACCESS_KEY_ID` | your AWS key |
   | `AWS_SECRET_ACCESS_KEY` | your AWS secret |
   | `AWS_REGION` | e.g. `us-east-1` |
   | `DYNAMODB_TABLE_NAME` | `lifeos-prod` (or whatever you named it) |
   | `JWT_SECRET` | a long random string |
   | `ANTHROPIC_API_KEY` | your real key — **or** set `USE_MOCK_AI=true` if you're keeping mock AI for the demo |
   | `GOOGLE_CLIENT_ID` | from Google Cloud Console |
   | `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |
   | `CLIENT_URL` | `https://<your-client-project-name>.vercel.app` (no trailing slash — see note below) |
   | `OAUTH_REDIRECT_BASE` | `https://<your-server-project-name>.vercel.app/api` |

   Vercel's production domain is predictable from the project name
   (`https://<project-name>.vercel.app`), so you can fill in `CLIENT_URL`
   and `OAUTH_REDIRECT_BASE` *before* either app has actually deployed —
   just pick your project names first.

5. Deploy.
6. Sanity check: visit `https://<server-domain>/health` — you should see
   `{"status":"ok",...}`.

## Step 3 — Register the production redirect URI with Google

Google checks the redirect URI on every request — it must match exactly.

1. Google Cloud Console → **APIs & Services → Credentials** → your OAuth
   client.
2. Under **Authorized redirect URIs**, add:
   `https://<your-server-domain>/api/integrations/google-calendar/callback`
3. Save. (Keep your `localhost:4000` one too, for local dev.)

## Step 4 — Deploy the client

1. **New Project → Import** the same repo.
2. **Root Directory:** `client`
3. Framework preset: Vite (auto-detected).
4. Environment Variables:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://<your-server-domain>/api` |
   | `VITE_GOOGLE_CLIENT_ID` | same Google Client ID as the server |

5. Deploy.

## Step 5 — Close the loop

If you didn't already know the client's exact final domain in Step 2,
go back to the **server** project's environment variables now, set
`CLIENT_URL` to the real client URL, and redeploy the server (env var
changes need a redeploy to take effect).

## Step 6 — Smoke test for real

On the live client URL:

1. Sign up / sign in.
2. Create a goal, toggle a milestone.
3. Go to **Integrations** → Connect Google Calendar → approve on
   Google's screen → confirm it redirects back and shows "Connected."
4. Disconnect it, confirm it goes back to "Not connected."

---

## Pitfalls specific to this codebase

- **CORS is an exact string match.** `server/src/config/env.js` reads
  `CLIENT_URL` and your `index.js` does
  `cors({ origin: env.clientUrl })`. A trailing slash or `http` vs
  `https` mismatch will silently block every API call from the browser
  (you'll see CORS errors in devtools, not a clear error message).
- **DynamoDB table must already exist.** You already ran `setup:db`
  locally — that created the table in your real AWS account, so you
  don't need to re-run it. You do need the *same* AWS credentials and
  region in Vercel's env vars, not just in your local `.env`.
- **Mock AI vs real AI.** If `USE_MOCK_AI` isn't `"true"` in production
  and `ANTHROPIC_API_KEY` is missing, the server still boots (it only
  warns at startup) but chat requests will fail at runtime. Decide
  deliberately which mode you want live for judges.
- **Function timeouts.** Real (non-mock) Claude calls with tool use can
  occasionally run long. If chat requests start timing out in
  production but work fine locally, that's the usual cause — Vercel's
  Hobby plan has shorter function duration limits than Pro.
