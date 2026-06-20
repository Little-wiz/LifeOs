// src/controllers/opportunities.controller.js
// Logic for tracking scholarships, internships, and programs.
// PK = USER#<userId>   SK = OPP#<goalId>#<oppId>

import { v4 as uuid } from "uuid";
import {
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../config/dynamodb.js";

export async function listOpportunities(req, res) {
  const { userId } = req;
  const { status, goalId } = req.query;

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": goalId ? `OPP#${goalId}#` : "OPP#",
      },
    })
  );

  let opportunities = result.Items || [];
  if (status) {
    opportunities = opportunities.filter((o) => o.status === status);
  }

  res.json(opportunities);
}

export async function createOpportunity(req, res) {
  const { userId } = req;
  const { name, goalId, url, deadline } = req.body;

  if (!name || !goalId) {
    return res.status(400).json({ error: "Name and goalId are required" });
  }

  const oppId = `opp_${uuid().slice(0, 8)}`;
  const opportunity = {
    PK: `USER#${userId}`,
    SK: `OPP#${goalId}#${oppId}`,
    oppId,
    goalId,
    name,
    url: url || null,
    deadline: deadline || null,
    status: "tracking",
    createdAt: new Date().toISOString(),
  };

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: opportunity }));
  res.status(201).json(opportunity);
}

export async function updateOpportunity(req, res) {
  const { userId } = req;
  const { oppId } = req.params;
  const { status } = req.body;

  // Since SK includes goalId, we need to find the full key first.
  const all = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "OPP#" },
    })
  );

  const existing = (all.Items || []).find((o) => o.oppId === oppId);
  if (!existing) {
    return res.status(404).json({ error: "Opportunity not found" });
  }

  const result = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: existing.PK, SK: existing.SK },
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
      ReturnValues: "ALL_NEW",
    })
  );

  res.json(result.Attributes);
}

export async function deleteOpportunity(req, res) {
  const { userId } = req;
  const { oppId } = req.params;

  const all = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "OPP#" },
    })
  );

  const existing = (all.Items || []).find((o) => o.oppId === oppId);
  if (!existing) {
    return res.status(404).json({ error: "Opportunity not found" });
  }

  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: existing.PK, SK: existing.SK },
    })
  );

  res.status(204).send();
}
