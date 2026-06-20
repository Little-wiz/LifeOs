// src/ai/contextAssembler.js
// Before every AI call, this gathers everything Claude needs to know
// about the user: their active goals, milestones, and recent messages.
// This is what gives LifeOS its "persistent memory" feel — the user
// never has to re-explain their situation.

import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../config/dynamodb.js";

export async function assembleContext(userId) {
  const [goalsResult, messagesResult] = await Promise.all([
    ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "GOAL#" },
      })
    ),
    ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "MSG#" },
        ScanIndexForward: false, // newest first
        Limit: 10,
      })
    ),
  ]);

  const goals = goalsResult.Items || [];

  // For each goal, fetch its milestones so the AI has full context.
  const goalsWithMilestones = await Promise.all(
    goals.map(async (goal) => {
      const milestones = await ddb.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          ExpressionAttributeValues: {
            ":pk": `USER#${userId}`,
            ":sk": `MILESTONE#${goal.goalId}#`,
          },
        })
      );
      return { ...goal, milestones: milestones.Items || [] };
    })
  );

  const recentMessages = (messagesResult.Items || []).reverse();

  return { goals: goalsWithMilestones, recentMessages };
}

// Turns the raw context data into a system prompt string for Claude.
export function buildSystemPrompt(context) {
  const { goals } = context;

  if (goals.length === 0) {
    return (
      "You are LifeOS, an AI that helps people turn goals into structured, " +
      "trackable plans. This user has no goals yet. When they describe " +
      "something they want to achieve, use the create_goal tool to set it " +
      "up with 4-8 concrete milestones. Be encouraging and specific."
    );
  }

  const goalSummaries = goals
    .map((g) => {
      const doneCount = g.milestones.filter((m) => m.status === "done").length;
      const milestoneList = g.milestones
        .map((m) => `    - [${m.status}] ${m.title}`)
        .join("\n");
      return (
        `- "${g.title}" (${g.category}, ${g.progressPercent}% complete, ` +
        `${doneCount}/${g.milestones.length} milestones done)\n${milestoneList}`
      );
    })
    .join("\n\n");

  return (
    "You are LifeOS, an AI that helps people turn goals into structured, " +
    "trackable plans and follow through on them. Here is what you know " +
    `about this user's current goals:\n\n${goalSummaries}\n\n` +
    "When the user reports progress, use update_milestone to mark the " +
    "relevant milestone. When they mention a new goal, use create_goal. " +
    "When they mention a specific opportunity (scholarship, internship, " +
    "program), use add_opportunity. Always be specific and reference real " +
    "goal and milestone names from the list above — don't invent new ones " +
    "unless the user is describing something genuinely new. Keep replies " +
    "concise and encouraging."
  );
}
