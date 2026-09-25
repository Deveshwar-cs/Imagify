import express from "express";

import upload from "../config/multer.js";

import {authenticateUser} from "../middleware/auth.middleware.js";

import {
  uploadStoredImage,
  getPublicImage,
  getStorageUsage,
  deleteStoredImage,
  getStoredImages,
} from "../controllers/storage.controller.js";

const router = express.Router();

router.post(
  "/upload",
  authenticateUser,
  upload.single("image"),
  uploadStoredImage,
);

router.get("/images/:imageId", getPublicImage);
router.get("/usage", authenticateUser, getStorageUsage);
router.get("/images", authenticateUser, getStoredImages);
router.delete("/images/:imageId", authenticateUser, deleteStoredImage);

export default router;
