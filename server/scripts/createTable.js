// scripts/createTable.js
// Run this once to create the DynamoDB table with the right schema.
// Usage: node scripts/createTable.js

import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import dotenv from "dotenv";
dotenv.config();

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const tableName = process.env.DYNAMODB_TABLE_NAME || "lifeos-prod";

const command = new CreateTableCommand({
  TableName: tableName,
  AttributeDefinitions: [
    { AttributeName: "PK", AttributeType: "S" },
    { AttributeName: "SK", AttributeType: "S" },
    { AttributeName: "GSI1PK", AttributeType: "S" },
    { AttributeName: "GSI1SK", AttributeType: "S" },
  ],
  KeySchema: [
    { AttributeName: "PK", KeyType: "HASH" },
    { AttributeName: "SK", KeyType: "RANGE" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "GSI1",
      KeySchema: [
        { AttributeName: "GSI1PK", KeyType: "HASH" },
        { AttributeName: "GSI1SK", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
  ],
  BillingMode: "PAY_PER_REQUEST", // on-demand — no capacity planning needed
});

try {
  const result = await client.send(command);
  console.log(`✅ Table "${tableName}" created successfully.`);
  console.log(`   Status: ${result.TableDescription.TableStatus}`);
} catch (err) {
  if (err.name === "ResourceInUseException") {
    console.log(`ℹ️  Table "${tableName}" already exists. Nothing to do.`);
  } else {
    console.error("❌ Failed to create table:", err.message);
    process.exit(1);
  }
}
