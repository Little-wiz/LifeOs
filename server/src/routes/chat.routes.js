// src/routes/chat.routes.js
// The conversational AI endpoint — this is the heart of LifeOS.

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as chatController from "../controllers/chat.controller.js";

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Conversational AI — the main way users interact with LifeOS
 */

/**
 * @swagger
 * /chat:
 *   post:
 *     summary: Send a message to the AI
 *     description: >
 *       Sends a message to LifeOS's AI. The AI reads the user's current
 *       goals and recent history, then replies — and may also create or
 *       update goals, milestones, and opportunities in the same turn.
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message: { type: string, example: "I finished the data preprocessing yesterday" }
 *     responses:
 *       200:
 *         description: The AI's reply, plus any actions it took
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply: { type: string }
 *                 actionsTaken:
 *                   type: array
 *                   items: { type: string, example: "Marked milestone 'Data preprocessing' as done" }
 */
router.post("/", asyncHandler(chatController.sendMessage));

/**
 * @swagger
 * /chat/history:
 *   get:
 *     summary: Get the recent conversation history
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of past messages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ChatMessage' }
 */
router.get("/history", asyncHandler(chatController.getHistory));

/**
 * @swagger
 * /chat/digest:
 *   get:
 *     summary: Generate this week's AI digest
 *     description: Reads all goal and milestone state and returns a structured weekly summary.
 *     tags: [Chat]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: The weekly digest
 */
router.get("/digest", asyncHandler(chatController.getDigest));

export default router;
