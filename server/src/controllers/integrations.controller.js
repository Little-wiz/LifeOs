// src/controllers/integrations.controller.js
// Manages connecting/disconnecting third-party apps.
// PK = USER#<userId>   SK = INTEGRATION#<provider>
//
// Google Calendar uses a real OAuth flow (see services/googleAuth.js).
// GitHub and Notion are intentionally stubbed for now — the UI and
// data model already support them, so wiring up their real OAuth
// later is a mechanical repeat of the same pattern used here for
// Google, not new design work.

import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import jwt from "jsonwebtoken";
import { ddb, TABLE_NAME } from "../config/dynamodb.js";
import { env } from "../config/env.js";
import { getGoogleAuthUrl, exchangeCodeForTokens } from "../services/googleAuth.js";

const SUPPORTED_PROVIDERS = ["google-calendar", "gmail", "github", "notion"];

const PROVIDER_LABELS = {
  "google-calendar": "Google Calendar",
  gmail: "Gmail",
  github: "GitHub",
  notion: "Notion",
};

// Providers with a real, working OAuth flow right now.
const LIVE_PROVIDERS = ["google-calendar"];

export async function listIntegrations(req, res) {
  const { userId } = req;

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "INTEGRATION#" },
    })
  );

  const connected = result.Items || [];
  const connectedProviders = new Set(connected.map((c) => c.provider));

  const allIntegrations = SUPPORTED_PROVIDERS.map((provider) => {
    const record = connected.find((c) => c.provider === provider);
    return {
      provider,
      name: PROVIDER_LABELS[provider],
      connected: connectedProviders.has(provider),
      lastSyncedAt: record?.lastSyncedAt || null,
      live: LIVE_PROVIDERS.includes(provider),
    };
  });

  res.json(allIntegrations);
}

export async function connect(req, res) {
  const { userId } = req;
  const { provider } = req.params;

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: "Unsupported provider" });
  }

  if (provider === "google-calendar") {
    // The `state` parameter is how we know which LifeOS user this is
    // when Google redirects back to us — the browser navigation to
    // /callback won't carry our normal Authorization header, so we
    // smuggle the userId through state instead, signed so it can't
    // be tampered with.
    const state = jwt.sign({ userId, provider }, env.jwtSecret, { expiresIn: "10m" });
    const redirectUrl = `${getGoogleAuthUrl()}&state=${encodeURIComponent(state)}`;
    return res.json({ redirectUrl });
  }

  // GitHub and Notion: not wired to real OAuth yet. Tell the frontend
  // honestly instead of pretending to redirect somewhere real.
  return res.status(501).json({
    error: `${PROVIDER_LABELS[provider]} isn't connected yet — coming soon.`,
  });
}

export async function callback(req, res) {
  const { provider } = req.params;
  const { code, state, error: googleError } = req.query;

  if (googleError) {
    return res.redirect(`${env.clientUrl}/integrations?error=${encodeURIComponent(googleError)}`);
  }

  if (!code || !state) {
    return res.redirect(`${env.clientUrl}/integrations?error=missing_code`);
  }

  // Recover which user this is, and verify the state wasn't tampered with.
  let userId;
  try {
    const decoded = jwt.verify(state, env.jwtSecret);
    userId = decoded.userId;
  } catch {
    return res.redirect(`${env.clientUrl}/integrations?error=invalid_state`);
  }

  if (provider === "google-calendar") {
    try {
      const tokens = await exchangeCodeForTokens(code);

      await ddb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `USER#${userId}`,
            SK: `INTEGRATION#${provider}`,
            provider,
            connectedAt: new Date().toISOString(),
            lastSyncedAt: new Date().toISOString(),
            // Only the refresh token needs to be kept long-term — it's
            // what lets us get new access tokens later without asking
            // the user to log in again. The short-lived access token
            // itself isn't stored since it expires quickly anyway.
            refreshToken: tokens.refresh_token,
          },
        })
      );

      return res.redirect(`${env.clientUrl}/integrations?connected=${provider}`);
    } catch (err) {
      console.error("Google token exchange failed:", err.message);
      return res.redirect(`${env.clientUrl}/integrations?error=token_exchange_failed`);
    }
  }

  return res.redirect(`${env.clientUrl}/integrations?error=unsupported_provider`);
}

export async function disconnect(req, res) {
  const { userId } = req;
  const { provider } = req.params;

  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `INTEGRATION#${provider}` },
    })
  );

  res.status(204).send();
}
