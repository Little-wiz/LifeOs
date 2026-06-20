// src/ai/tools.js
// Defines the tools Claude can call during a chat conversation.
// Each tool here maps to a real DynamoDB write — when Claude "uses a tool",
// our code actually creates a goal, updates a milestone, etc.

export const tools = [
  {
    name: "create_goal",
    description:
      "Create a new goal for the user, broken into milestones. Use this when " +
      "the user describes something they want to achieve.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Short, clear goal title" },
        category: {
          type: "string",
          description: "One of: Career, Education, Project, Scholarship, Health, Other",
        },
        targetDate: {
          type: "string",
          description: "ISO date string for when the user wants to achieve this, if known",
        },
        milestones: {
          type: "array",
          description: "4-8 concrete milestones that break the goal into steps",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              dueDate: { type: "string", description: "ISO date string, estimated" },
            },
            required: ["title"],
          },
        },
      },
      required: ["title", "category", "milestones"],
    },
  },
  {
    name: "update_milestone",
    description:
      "Mark a milestone as done, in progress, or pending. Use this when the " +
      "user reports progress on something.",
    input_schema: {
      type: "object",
      properties: {
        goalId: { type: "string", description: "The ID of the goal this milestone belongs to" },
        milestoneTitle: {
          type: "string",
          description: "The title of the milestone to update (matched against existing milestones)",
        },
        status: { type: "string", enum: ["pending", "in_progress", "done"] },
      },
      required: ["goalId", "milestoneTitle", "status"],
    },
  },
  {
    name: "add_opportunity",
    description:
      "Attach a scholarship, internship, or program to a goal. Use this when " +
      "the user mentions a specific opportunity they're applying to or tracking.",
    input_schema: {
      type: "object",
      properties: {
        goalId: { type: "string" },
        name: { type: "string", example: "Google STEP Internship" },
        url: { type: "string" },
        deadline: { type: "string", description: "ISO date string" },
      },
      required: ["goalId", "name"],
    },
  },
];
