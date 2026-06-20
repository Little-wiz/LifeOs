// src/index.js
// The main entry point. Wires together middleware, routes, and Swagger docs.

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import goalsRoutes from "./routes/goals.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import opportunitiesRoutes from "./routes/opportunities.routes.js";
import integrationsRoutes from "./routes/integrations.routes.js";

const app = express();

app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Interactive API docs — visit /api-docs in the browser to try every
// endpoint without needing Postman or curl.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/goals", goalsRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/opportunities", opportunitiesRoutes);
app.use("/api/integrations", integrationsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`🚀 LifeOS API running on http://localhost:${env.port}`);
  console.log(`📚 API docs available at http://localhost:${env.port}/api-docs`);
});
