// src/config/env.js
// Central place that reads every environment variable the app needs.
// If something is missing, we fail loudly here instead of getting a
// confusing error later deep inside some unrelated function.

import dotenv from "dotenv";
dotenv.config();

const required = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "DYNAMODB_TABLE_NAME",
  "JWT_SECRET",
];

// Only require a real Anthropic key if we're NOT using the mock AI layer.
if (process.env.USE_MOCK_AI !== "true") {
  required.push("ANTHROPIC_API_KEY");
}

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.warn(
    `⚠️  Missing environment variables: ${missing.join(", ")}\n` +
      `   The server will start, but features depending on these will fail.`
  );
}

if (process.env.USE_MOCK_AI === "true") {
  console.log("🪄  Mock AI mode is ON — no real Claude API calls will be made.");
}

export const env = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  awsRegion: process.env.AWS_REGION || "us-east-1",
  dynamoTable: process.env.DYNAMODB_TABLE_NAME || "lifeos-prod",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  useMockAI: process.env.USE_MOCK_AI === "true",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  oauthRedirectBase: process.env.OAUTH_REDIRECT_BASE || "http://localhost:4000/api",
};
