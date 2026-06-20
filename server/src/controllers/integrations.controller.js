// src/controllers/integrations.controller.js
// Manages connecting/disconnecting third-party apps via MCP.
// PK = USER#<userId>   SK = INTEGRATION#<provider>
//
// NOTE: The actual MCP client connection logic (talking to the real
// Google Calendar / GitHub / Notion MCP servers) lives in
// src/services/mcpClient.js. This controller handles the HTTP layer:
// starting the OAuth flow, handling the callback, and storing tokens.

import { PutCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../config/dynamodb.js";

const SUPPORTED_PROVIDERS = ["google-calendar", "gmail", "github", "notion"];

const PROVIDER_LABELS = {
  "google-calendar": "Google Calendar",
  gmail: "Gmail",
  github: "GitHub",
  notion: "Notion",
};

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
    };
  });

  res.json(allIntegrations);
}

export async function connect(req, res) {
  const { provider } = req.params;

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: "Unsupported provider" });
  }

  // In the full implementation, this builds the real OAuth URL for
  // the given provider's MCP server (each has its own OAuth client ID,
  // redirect URI, and scopes). Stubbed here for scaffolding purposes.
  const redirectUrl = `https://oauth.example.com/${provider}/authorize?client_id=PLACEHOLDER&redirect_uri=${encodeURIComponent(
    process.env.OAUTH_REDIRECT_BASE + "/integrations/" + provider + "/callback"
  )}`;

  res.json({ redirectUrl });
}

export async function callback(req, res) {
  const { userId } = req;
  const { provider } = req.params;
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  // In the full implementation: exchange `code` for an access token
  // with the provider's MCP server, then store the token securely.
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: `INTEGRATION#${provider}`,
        provider,
        connectedAt: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString(),
        // accessToken / refreshToken would be stored here, encrypted.
      },
    })
  );

  res.json({ success: true, provider });
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
