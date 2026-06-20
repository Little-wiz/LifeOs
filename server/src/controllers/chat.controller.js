// src/controllers/chat.controller.js
// The main chat endpoint. This is where everything comes together:
// 1. Load the user's context (goals, milestones, recent messages)
// 2. Call Claude with that context + the available tools
// 3. If Claude uses a tool, actually perform the database write
// 4. Save the conversation and return the reply

import Anthropic from "@anthropic-ai/sdk";
import { v4 as uuid } from "uuid";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLE_NAME } from "../config/dynamodb.js";
import { env } from "../config/env.js";
import { tools } from "../ai/tools.js";
import { assembleContext, buildSystemPrompt } from "../ai/contextAssembler.js";
import { mockAnthropic } from "../ai/mockAnthropic.js";

const anthropic = env.useMockAI
  ? mockAnthropic
  : new Anthropic({ apiKey: env.anthropicApiKey });
  
async function saveMessage(userId, role, content) {
  await ddb.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `USER#${userId}`,
        SK: `MSG#${Date.now()}#${uuid().slice(0, 6)}`,
        role,
        content,
        timestamp: new Date().toISOString(),
      },
    })
  );
}

// Executes a tool call from Claude as a real database operation.
// Returns a short string describing what happened, which gets fed
// back to Claude so it can reference it in its reply.
async function executeTool(userId, toolName, input) {
  if (toolName === "create_goal") {
    const goalId = `goal_${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `GOAL#${goalId}`,
          goalId,
          userId,
          title: input.title,
          category: input.category,
          status: "active",
          targetDate: input.targetDate || null,
          progressPercent: 0,
          createdAt: now,
        },
      })
    );

    for (const m of input.milestones || []) {
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

    return `Created goal "${input.title}" with ${input.milestones?.length || 0} milestones.`;
  }

  if (toolName === "update_milestone") {
    const milestones = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": `MILESTONE#${input.goalId}#`,
        },
      })
    );

    const match = (milestones.Items || []).find(
      (m) => m.title.toLowerCase() === input.milestoneTitle.toLowerCase()
    );

    if (!match) {
      return `Could not find a milestone matching "${input.milestoneTitle}".`;
    }

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: { ...match, status: input.status },
      })
    );

    // Recalculate goal progress.
    const allMilestones = (milestones.Items || []).map((m) =>
      m.milestoneId === match.milestoneId ? { ...m, status: input.status } : m
    );
    const doneCount = allMilestones.filter((m) => m.status === "done").length;
    const progressPercent = allMilestones.length
      ? Math.round((doneCount / allMilestones.length) * 100)
      : 0;

    const goalResult = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": `USER#${userId}`,
          ":sk": `GOAL#${input.goalId}`,
        },
      })
    );
    if (goalResult.Items?.[0]) {
      await ddb.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: { ...goalResult.Items[0], progressPercent },
        })
      );
    }

    return `Marked "${input.milestoneTitle}" as ${input.status}.`;
  }

  if (toolName === "add_opportunity") {
    const oppId = `opp_${uuid().slice(0, 8)}`;
    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${userId}`,
          SK: `OPP#${input.goalId}#${oppId}`,
          oppId,
          goalId: input.goalId,
          name: input.name,
          url: input.url || null,
          deadline: input.deadline || null,
          status: "tracking",
          createdAt: new Date().toISOString(),
        },
      })
    );
    return `Added "${input.name}" as a tracked opportunity.`;
  }

  return "Unknown tool.";
}

export async function sendMessage(req, res) {
  const { userId } = req;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  await saveMessage(userId, "user", message);

  const context = await assembleContext(userId);
  const systemPrompt = buildSystemPrompt(context);

  const conversationHistory = context.recentMessages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    tools,
    messages: [...conversationHistory, { role: "user", content: message }],
  });

  const actionsTaken = [];

  // Claude may call one or more tools before giving a final text reply.
  // Keep executing tools and feeding results back until it stops.
  while (response.stop_reason === "tool_use") {
    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
    const toolResults = [];

    for (const block of toolUseBlocks) {
      const resultText = await executeTool(userId, block.name, block.input);
      actionsTaken.push(resultText);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: resultText,
      });
    }

    response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages: [
        ...conversationHistory,
        { role: "user", content: message },
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults },
      ],
    });
  }

  const finalText = response.content.find((b) => b.type === "text")?.text || "";

  await saveMessage(userId, "assistant", finalText);

  res.json({ reply: finalText, actionsTaken });
}

export async function getHistory(req, res) {
  const { userId } = req;
  const limit = parseInt(req.query.limit) || 20;

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: { ":pk": `USER#${userId}`, ":sk": "MSG#" },
      ScanIndexForward: false,
      Limit: limit,
    })
  );

  res.json((result.Items || []).reverse());
}

export async function getDigest(req, res) {
  const { userId } = req;
  const context = await assembleContext(userId);

  const digestPrompt =
    "Based on the goals and milestones below, write a short weekly digest " +
    "for the user. Include: (1) wins from the past week, (2) anything " +
    "stalled or at risk, (3) top 3 priority actions for next week. Keep it " +
    "concise, specific, and encouraging but honest.\n\n" +
    JSON.stringify(context.goals, null, 2);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [{ role: "user", content: digestPrompt }],
  });

  const digestText = response.content.find((b) => b.type === "text")?.text || "";
  res.json({ digest: digestText, generatedAt: new Date().toISOString() });
}
