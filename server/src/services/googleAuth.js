// src/services/googleAuth.js
//
// Handles the real Google OAuth flow for connecting Google Calendar.
// This replaces the placeholder oauth.example.com URL with an actual
// working Google sign-in flow.
//
// How it works, in plain terms:
// 1. We send the user to a real Google URL where they log in and
//    approve LifeOS reading their calendar.
// 2. Google redirects them back to our server with a temporary code.
// 3. We exchange that code for real access + refresh tokens.
// 4. We store those tokens in DynamoDB so we can read their calendar
//    later without asking them to log in again.

import { google } from "googleapis";
import { env } from "../config/env.js";

const REDIRECT_URI = `${env.oauthRedirectBase}/integrations/google-calendar/callback`;

// The specific permission we're asking for — read-only access to
// the user's calendar events. We deliberately request the narrowest
// scope that does the job, not broader calendar edit access.
const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];

function createOAuthClient() {
  return new google.auth.OAuth2(
    env.googleClientId,
    env.googleClientSecret,
    REDIRECT_URI
  );
}

// Step 1: build the URL we send the user to.
export function getGoogleAuthUrl() {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline", // gives us a refresh token, not just a short-lived access token
    scope: SCOPES,
    prompt: "consent", // always show the consent screen, even on repeat connections
  });
}

// Step 3: exchange the code Google sent back for real tokens.
export async function exchangeCodeForTokens(code) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens; // { access_token, refresh_token, expiry_date, ... }
}

// Uses a stored refresh token to fetch the user's upcoming calendar
// events. Called later, whenever LifeOS needs fresh calendar context
// (e.g. when assembling chat context or running the weekly digest).
export async function getUpcomingEvents(refreshToken, maxResults = 10) {
  const client = createOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: "v3", auth: client });

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: new Date().toISOString(),
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}
