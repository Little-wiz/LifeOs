// src/routes/goals.routes.js
// CRUD for goals and their milestones.

import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as goalsController from "../controllers/goals.controller.js";

const router = Router();
router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Goals
 *   description: Create, read, update goals and their milestones
 */

/**
 * @swagger
 * /goals:
 *   get:
 *     summary: List all goals for the logged-in user
 *     tags: [Goals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, stalled, completed] }
 *         description: Filter goals by status
 *     responses:
 *       200:
 *         description: A list of goals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Goal' }
 */
router.get("/", asyncHandler(goalsController.listGoals));

/**
 * @swagger
 * /goals:
 *   post:
 *     summary: Create a new goal (manually, without AI)
 *     tags: [Goals]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, category]
 *             properties:
 *               title: { type: string, example: "Land an ML internship by March" }
 *               category: { type: string, example: "Career" }
 *               targetDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Goal created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Goal' }
 */
router.post("/", asyncHandler(goalsController.createGoal));

/**
 * @swagger
 * /goals/{goalId}:
 *   get:
 *     summary: Get a single goal with its milestones
 *     tags: [Goals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Goal with milestones
 *       404:
 *         description: Goal not found
 */
router.get("/:goalId", asyncHandler(goalsController.getGoal));

/**
 * @swagger
 * /goals/{goalId}:
 *   patch:
 *     summary: Update a goal's details
 *     tags: [Goals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               status: { type: string, enum: [active, stalled, completed] }
 *               targetDate: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Updated goal
 */
router.patch("/:goalId", asyncHandler(goalsController.updateGoal));

/**
 * @swagger
 * /goals/{goalId}:
 *   delete:
 *     summary: Delete a goal and all its milestones
 *     tags: [Goals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Deleted successfully
 */
router.delete("/:goalId", asyncHandler(goalsController.deleteGoal));

/**
 * @swagger
 * /goals/{goalId}/milestones/{milestoneId}:
 *   patch:
 *     summary: Update a milestone's status (e.g. mark as done)
 *     tags: [Goals]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: goalId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: milestoneId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [pending, in_progress, done] }
 *     responses:
 *       200:
 *         description: Updated milestone
 */
router.patch(
  "/:goalId/milestones/:milestoneId",
  asyncHandler(goalsController.updateMilestone)
);

export default router;
