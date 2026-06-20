// src/routes/auth.routes.js
// Handles sign up, sign in, and Google OAuth.

import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Sign up, sign in, and session handling
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: "Lil wiz" }
 *               email: { type: string, example: "lilwiz@example.com" }
 *               password: { type: string, example: "supersecure123" }
 *     responses:
 *       201:
 *         description: Account created, returns a JWT token
 *       400:
 *         description: Email already in use or invalid input
 */
router.post("/signup", asyncHandler(authController.signup));

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Signed in, returns a JWT token
 *       401:
 *         description: Wrong email or password
 */
router.post("/signin", asyncHandler(authController.signin));

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Sign in or sign up using a Google account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [idToken]
 *             properties:
 *               idToken: { type: string, description: "Google ID token from the frontend OAuth flow" }
 *     responses:
 *       200:
 *         description: Signed in, returns a JWT token
 */
router.post("/google", asyncHandler(authController.googleAuth));

export default router;
