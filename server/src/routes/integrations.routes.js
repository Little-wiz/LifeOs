// src/routes/integrations.routes.js
// Connecting and managing third-party apps via MCP (Model Context Protocol).

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as integrationsController from "../controllers/integrations.controller.js";

const router = Router();

// NOTE: We do NOT apply requireAuth to the whole router here, unlike
// the other route files. The /callback route below is hit by the
// browser navigating back from Google directly — it has no
// Authorization header to check. Instead, we identify the user via
// a signed `state` parameter (see connect() in the controller).
// Every other route below still requires auth individually.

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
 *                   live: { type: boolean, description: "True if this provider has a real OAuth flow wired up. False means it's UI-only / coming soon." }
 *                   connected: { type: boolean }
 *                   lastSyncedAt: { type: string, format: date-time }
 */
router.get("/", requireAuth, asyncHandler(integrationsController.listIntegrations));

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
router.post("/:provider/connect", requireAuth, asyncHandler(integrationsController.connect));

/**
 * @swagger
 * /integrations/{provider}/callback:
 *   get:
 *     summary: OAuth callback — exchanges the auth code for an access token
 *     description: >
 *       Google redirects the user's browser here after they approve
 *       access. This route is not meant to be called directly — it
 *       exchanges the code for tokens, saves them, then redirects the
 *       browser back to the Integrations page in the app.
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
 *       - in: query
 *         name: state
 *         required: true
 *         schema: { type: string, description: "Signed token identifying which user is connecting" }
 *     responses:
 *       302:
 *         description: Redirects back to the app's Integrations page
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
router.delete("/:provider", requireAuth, asyncHandler(integrationsController.disconnect));

export default router;
