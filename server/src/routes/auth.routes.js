import express from "express";

import {
  googleLogin,
  getCurrentUser,
  logout,
} from "../controllers/auth.controller.js";

import {authenticateUser} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/google", googleLogin);

router.get("/me", authenticateUser, getCurrentUser);

router.post("/logout", logout);

export default router;
