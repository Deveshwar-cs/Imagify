import express from "express";

import upload from "../config/multer.js";

import {
  getBatchStatus,
  queueImageProcessing,
  subscribeToPush,
  testPushNotification,
} from "../controllers/image.controller.js";

import {
  createScreenshotShare,
  createShare,
  getSharedProcessedImage,
  getSharedResults,
} from "../controllers/share.controller.js";

import {identifyUserOrGuest} from "../middleware/identify.middleware.js";

import {authenticateUser} from "../middleware/auth.middleware.js";

const router = express.Router();

// =========================================
// QUEUE-BASED IMAGE PROCESSING
// =========================================

router.post(
  "/process",
  identifyUserOrGuest,
  upload.array("images", 10),
  queueImageProcessing,
);

// =========================================
// BATCH STATUS
// =========================================

router.get("/batches/:batchId", identifyUserOrGuest, getBatchStatus);

// =========================================
// PUSH NOTIFICATIONS
// =========================================

router.post("/push/subscribe", subscribeToPush);

router.post("/push/test", testPushNotification);

// =========================================
// SHARING
// =========================================

// Authenticated user creates share link
router.post("/share", authenticateUser, createShare);

// Public user opens share page
router.get("/share/:token", getSharedResults);

// Public user requests processed image
router.get("/share/:token/processed/:imageId", getSharedProcessedImage);

// =========================================
// SCREENSHOT SHARING
// =========================================

// Authenticated user uploads screenshot
// and creates share link
router.post(
  "/share/screenshot",
  authenticateUser,
  upload.single("image"),
  createScreenshotShare,
);

export default router;
