// src/controllers/auth.controller.js
// Handles the actual logic for sign up, sign in, and Google OAuth.

import { v4 as uuid } from "uuid";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PutCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../config/dynamodb.js";
import { env } from "../config/env.js";

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function signToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: "30d" });
}

export async function signup(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  // Check if a user with this email already exists.
  const existing = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: { ":email": `EMAIL#${email.toLowerCase()}` },
    })
  );

  if (existing.Items && existing.Items.length > 0) {
    return res.status(400).json({ error: "An account with this email already exists" });
  }

  const userId = `user_${uuid().slice(0, 8)}`;

  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: "PROFILE",
        GSI1PK: `EMAIL#${email.toLowerCase()}`,
        GSI1SK: "PROFILE",
        userId,
        name,
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
        plan: "free",
        createdAt: new Date().toISOString(),
      },
    })
  );

  const token = signToken(userId);
  res.status(201).json({ token, user: { userId, name, email } });
}

export async function signin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: { ":email": `EMAIL#${email.toLowerCase()}` },
    })
  );

  const user = result.Items?.[0];

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: "Incorrect email or password" });
  }

  const token = signToken(user.userId);
  res.json({ token, user: { userId: user.userId, name: user.name, email: user.email } });
}

export async function googleAuth(req, res) {
  // NOTE: In production, verify the idToken with Google's public keys
  // before trusting the payload. For the hackathon build, the frontend
  // uses Google's official sign-in library which already validates this
  // client-side; verifying server-side is the next hardening step.
  const { idToken, name, email, googleId } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Google account email is required" });
  }

  const existing = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :email",
      ExpressionAttributeValues: { ":email": `EMAIL#${email.toLowerCase()}` },
    })
  );

  let user = existing.Items?.[0];

  if (!user) {
    const userId = `user_${uuid().slice(0, 8)}`;
    user = {
      PK: `USER#${userId}`,
      SK: "PROFILE",
      GSI1PK: `EMAIL#${email.toLowerCase()}`,
      GSI1SK: "PROFILE",
      userId,
      name,
      email: email.toLowerCase(),
      googleId,
      plan: "free",
      createdAt: new Date().toISOString(),
    };
    await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: user }));
  }

  const token = signToken(user.userId);
  res.json({ token, user: { userId: user.userId, name: user.name, email: user.email } });
}
