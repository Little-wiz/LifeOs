// src/routes/opportunities.routes.js
// Tracking scholarships, internships, and programs linked to goals.

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as oppController from "../controllers/opportunities.controller.js";

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Opportunities
 *   description: Scholarships, internships, and programs the user is tracking
 */

/**
 * @swagger
 * /opportunities:
 *   get:
 *     summary: List all tracked opportunities
 *     tags: [Opportunities]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [tracking, applied, rejected, won] }
 *       - in: query
 *         name: goalId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of opportunities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Opportunity' }
 */
router.get("/", asyncHandler(oppController.listOpportunities));

/**
 * @swagger
 * /opportunities:
 *   post:
 *     summary: Add a new opportunity
 *     tags: [Opportunities]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, goalId]
 *             properties:
 *               name: { type: string, example: "Google STEP Internship 2026" }
 *               goalId: { type: string }
 *               url: { type: string }
 *               deadline: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Opportunity created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Opportunity' }
 */
router.post("/", asyncHandler(oppController.createOpportunity));

/**
 * @swagger
 * /opportunities/{oppId}:
 *   patch:
 *     summary: Update an opportunity's status
 *     tags: [Opportunities]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: oppId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [tracking, applied, rejected, won] }
 *     responses:
 *       200:
 *         description: Updated opportunity
 */
router.patch("/:oppId", asyncHandler(oppController.updateOpportunity));

/**
 * @swagger
 * /opportunities/{oppId}:
 *   delete:
 *     summary: Remove an opportunity
 *     tags: [Opportunities]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: oppId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted successfully
 */
router.delete("/:oppId", asyncHandler(oppController.deleteOpportunity));

export default router;
