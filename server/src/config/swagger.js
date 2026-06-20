// src/config/swagger.js
// Builds the Swagger (OpenAPI) spec for the whole API.
// swagger-jsdoc reads the comment blocks above each route (look for
// "@swagger" in the route files) and turns them into this spec.
// The spec is then served as an interactive page by swagger-ui-express.

import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LifeOS API",
      version: "1.0.0",
      description:
        "API for LifeOS — an AI-powered goal execution platform. " +
        "Handles authentication, goals, milestones, opportunities, " +
        "AI chat, and third-party integrations via MCP.",
      contact: {
        name: "LifeOS",
      },
    },
    servers: [
      {
        url: "http://localhost:4000/api",
        description: "Local development server",
      },
      {
        url: "https://lifeos-api.vercel.app/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Goal: {
          type: "object",
          properties: {
            goalId: { type: "string", example: "goal_3f9a" },
            userId: { type: "string", example: "user_8b2c" },
            title: { type: "string", example: "ML internship by March" },
            category: { type: "string", example: "Career" },
            status: {
              type: "string",
              enum: ["active", "stalled", "completed"],
              example: "active",
            },
            targetDate: { type: "string", format: "date", example: "2026-03-01" },
            progressPercent: { type: "number", example: 33 },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Milestone: {
          type: "object",
          properties: {
            milestoneId: { type: "string", example: "ms_1a2b" },
            goalId: { type: "string", example: "goal_3f9a" },
            title: { type: "string", example: "Complete ML fundamentals course" },
            status: {
              type: "string",
              enum: ["pending", "in_progress", "done"],
              example: "done",
            },
            dueDate: { type: "string", format: "date" },
          },
        },
        Opportunity: {
          type: "object",
          properties: {
            oppId: { type: "string", example: "opp_9z8y" },
            goalId: { type: "string", example: "goal_3f9a" },
            name: { type: "string", example: "Google STEP Internship 2026" },
            url: { type: "string", example: "https://careers.google.com" },
            deadline: { type: "string", format: "date" },
            status: {
              type: "string",
              enum: ["tracking", "applied", "rejected", "won"],
              example: "tracking",
            },
          },
        },
        ChatMessage: {
          type: "object",
          properties: {
            role: { type: "string", enum: ["user", "assistant"] },
            content: { type: "string" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string", example: "Goal not found" },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
