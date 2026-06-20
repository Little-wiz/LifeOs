// src/config/dynamodb.js
// Sets up the connection to Amazon DynamoDB.
// This file is the only place that knows how to talk to AWS directly —
// every other file goes through this client instead of configuring its own.

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const rawClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// The DocumentClient lets us work with plain JS objects instead of
// DynamoDB's verbose { S: "value" } attribute format.
export const ddb = DynamoDBDocumentClient.from(rawClient);

export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "lifeos-prod";
