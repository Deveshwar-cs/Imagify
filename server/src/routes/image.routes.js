import express from "express";

import upload from "../config/multer.js";

import {
  getBatchStatus,
  queueImageProcessing,
  uploadImage,
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

const router = express.Router();

// Upload
router.post(
  "/upload",
  identifyUserOrGuest,
  upload.array("images", 10),
  uploadImage,
);

// Queue-based processing
router.post("/process", identifyUserOrGuest, queueImageProcessing);

// Batch status
router.get("/batches/:batchId", identifyUserOrGuest, getBatchStatus);

// Push notifications
router.post("/push/subscribe", subscribeToPush);

router.post("/push/test", testPushNotification);

// Sharing
router.post("/share", createShare);

router.get("/share/:token", getSharedResults);

router.get("/share/:token/processed/:imageId", getSharedProcessedImage);

// ScreenShot
router.post(
  "/share/screenshot",
  identifyUserOrGuest,
  upload.single("image"),
  createScreenshotShare,
);

export default router;
