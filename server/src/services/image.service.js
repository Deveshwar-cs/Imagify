import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import {buffer} from "stream/consumers";

export const createTempFilePath = (extension = ".jpg") => {
  const fileName = `${crypto.randomBytes(12).toString("hex")}${extension}`;

  return path.join(os.tmpdir(), fileName);
};

export const downloadImageToTemp = async (imageUrl) => {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error("Failed to download image from cloudinary");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const tempPath = createTempFilePath();
  await fs.writeFile(tempPath, buffer);

  return tempPath;
};

export const uploadToCloudinary = async (
  filePath,
  folder = "imagify/processed",
) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: "image",
  });
  return result;
};

export const cleanupTempFile = async (filePath) => {
  if (!filePath) {
    return;
  }
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.log("Temporary file cleanup error:", error.message);
  }
};
