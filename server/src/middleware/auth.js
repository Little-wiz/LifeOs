// src/middleware/auth.js
// Checks that a request has a valid login token before letting it through.
// Every route that needs to know "who is making this request" uses this.

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
