import express from "express";
import upload from "../config/multer.js";
import {
  compressImage,
  improveQuality,
  resizeImage,
  uploadImage,
  upscaleImage,
} from "../controllers/image.controller.js";

const router = express.Router();

router.post("/upload", upload.array("images", 10), uploadImage);
router.post("/:imageId/resize", resizeImage);
router.post("/:imageId/compress", compressImage);
router.post("/:imageId/quality", improveQuality);
router.post("/:imageId/upscale", upscaleImage);

export default router;
