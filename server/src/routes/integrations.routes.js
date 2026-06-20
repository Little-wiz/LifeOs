// src/routes/integrations.routes.js
// Connecting and managing third-party apps via MCP (Model Context Protocol).

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as integrationsController from "../controllers/integrations.controller.js";

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Integrations
 *   description: Connect external apps (Google Calendar, GitHub, Notion, Gmail) via MCP
 */

/**
 * @swagger
 * /integrations:
 *   get:
 *     summary: List all available integrations and their connection status
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of integrations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name: { type: string, example: "Google Calendar" }
 *                   connected: { type: boolean }
 *                   lastSyncedAt: { type: string, format: date-time }
 */
router.get("/", asyncHandler(integrationsController.listIntegrations));

/**
 * @swagger
 * /integrations/{provider}/connect:
 *   post:
 *     summary: Start the OAuth flow to connect an app
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema: { type: string, enum: [google-calendar, gmail, github, notion] }
 *     responses:
 *       200:
 *         description: Returns the OAuth URL the frontend should redirect to
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 redirectUrl: { type: string }
 */
router.post("/:provider/connect", asyncHandler(integrationsController.connect));

/**
 * @swagger
 * /integrations/{provider}/callback:
 *   get:
 *     summary: OAuth callback — exchanges the auth code for an access token
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: code
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Integration connected successfully
 */
router.get("/:provider/callback", asyncHandler(integrationsController.callback));

/**
 * @swagger
 * /integrations/{provider}:
 *   delete:
 *     summary: Disconnect an integration
 *     tags: [Integrations]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Disconnected successfully
 */
router.delete("/:provider", asyncHandler(integrationsController.disconnect));

export default router;
