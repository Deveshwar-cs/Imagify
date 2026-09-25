import express from "express";

import upload from "../config/multer.js";

import {
  compressImage,
  getBatchStatus,
  improveQuality,
  queueImageProcessing,
  resizeImage,
  uploadImage,
  upscaleImage,
  subscribeToPush,
  testPushNotification,
} from "../controllers/image.controller.js";

import {
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

// Direct image processing
router.post("/:imageId/resize", identifyUserOrGuest, resizeImage);

router.post("/:imageId/compress", identifyUserOrGuest, compressImage);

router.post("/:imageId/quality", identifyUserOrGuest, improveQuality);

router.post("/:imageId/upscale", identifyUserOrGuest, upscaleImage);

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

export default router;
