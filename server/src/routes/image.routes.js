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

const router = express.Router();

router.post("/upload", upload.array("images", 10), uploadImage);
router.post("/:imageId/resize", resizeImage);
router.post("/:imageId/compress", compressImage);
router.post("/:imageId/quality", improveQuality);
router.post("/:imageId/upscale", upscaleImage);
router.post("/process", queueImageProcessing);
router.get("/batches/:batchId", getBatchStatus);
router.post("/push/subscribe", subscribeToPush);
router.post("/push/test", testPushNotification);
router.post("/share", createShare);
router.get("/share/:token", getSharedResults);
router.get("/share/:token/processed/:imageId", getSharedProcessedImage);
export default router;
