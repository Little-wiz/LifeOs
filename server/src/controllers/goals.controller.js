// src/controllers/goals.controller.js
// Logic for creating, reading, updating, and deleting goals + milestones.
// Uses the single-table DynamoDB design:
//   PK = USER#<userId>           SK = GOAL#<goalId>
//   PK = USER#<userId>           SK = MILESTONE#<goalId>#<milestoneId>

import { v4 as uuid } from "uuid";
import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../config/dynamodb.js";

export async function listGoals(req, res) {
  const { userId } = req;
  const { status } = req.query;

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": "GOAL#",
      },
    })
  );

  let goals = result.Items || [];
  if (status) {
    goals = goals.filter((g) => g.status === status);
  }

  res.json(goals);
}

export async function createGoal(req, res) {
  const { userId } = req;
  const { title, category, targetDate, milestones = [] } = req.body;

  if (!title || !category) {
    return res.status(400).json({ error: "Title and category are required" });
  }

  const goalId = `goal_${uuid().slice(0, 8)}`;
  const now = new Date().toISOString();

  const goal = {
    PK: `USER#${userId}`,
    SK: `GOAL#${goalId}`,
    goalId,
    userId,
    title,
    category,
    status: "active",
    targetDate: targetDate || null,
    progressPercent: 0,
    createdAt: now,
  };

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: goal }));

  // If milestones were provided (e.g. AI-generated), create them too.
  for (const m of milestones) {
    const milestoneId = `ms_${uuid().slice(0, 8)}`;
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `MILESTONE#${goalId}#${milestoneId}`,
          milestoneId,
          goalId,
          title: m.title,
          status: "pending",
          dueDate: m.dueDate || null,
          createdAt: now,
        },
      })
    );
  }

  res.status(201).json(goal);
}

export async function getGoal(req, res) {
  const { userId } = req;
  const { goalId } = req.params;

  const goalResult = await ddb.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `GOAL#${goalId}` },
    })
  );

  if (!goalResult.Item) {
    return res.status(404).json({ error: "Goal not found" });
  }

  const milestonesResult = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": `MILESTONE#${goalId}#`,
      },
    })
  );

  res.json({ ...goalResult.Item, milestones: milestonesResult.Items || [] });
}

export async function updateGoal(req, res) {
  const { userId } = req;
  const { goalId } = req.params;
  const updates = req.body;

  const allowedFields = ["title", "status", "targetDate", "category"];
  const updateExpressions = [];
  const values = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateExpressions.push(`${field} = :${field}`);
      values[`:${field}`] = updates[field];
    }
  }

  if (updateExpressions.length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  const result = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `GOAL#${goalId}` },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );

  res.json(result.Attributes);
}

export async function deleteGoal(req, res) {
  const { userId } = req;
  const { goalId } = req.params;

  // Delete the goal itself.
  await ddb.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `GOAL#${goalId}` },
    })
  );

  // Delete all milestones belonging to this goal.
  const milestones = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": `MILESTONE#${goalId}#`,
      },
    })
  );

  for (const m of milestones.Items || []) {
    await ddb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: m.PK, SK: m.SK },
      })
    );
  }

  res.status(204).send();
}

export async function updateMilestone(req, res) {
  const { userId } = req;
  const { goalId, milestoneId } = req.params;
  const { status } = req.body;

  if (!["pending", "in_progress", "done"].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }

  const result = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `MILESTONE#${goalId}#${milestoneId}` },
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: { "#status": "status" },
      ExpressionAttributeValues: { ":status": status },
      ReturnValues: "ALL_NEW",
    })
  );

  // Recalculate the parent goal's progress percentage.
  const allMilestones = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `USER#${userId}`,
        ":sk": `MILESTONE#${goalId}#`,
      },
    })
  );

  const items = allMilestones.Items || [];
  const doneCount = items.filter((m) => m.status === "done").length;
  const progressPercent = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `USER#${userId}`, SK: `GOAL#${goalId}` },
      UpdateExpression: "SET progressPercent = :p",
      ExpressionAttributeValues: { ":p": progressPercent },
    })
  );

  res.json(result.Attributes);
}
