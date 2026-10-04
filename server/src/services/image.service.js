import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

import ProcessingBatch from "../models/processing.batch.model.js";
import cloudinary from "../config/cloudinary.js";

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

export const uploadBufferToCloudinary = (
  buffer,
  folder = "imagify/processed",
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) {
    return;
  }

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    type: "upload",
    invalidate: true,
  });

  console.log(`Cloudinary deleted result for ${publicId}`, result.result);

  return result;
};

export const cleanupProcessedImages = async (results = []) => {
  if (!results.length) {
    return true;
  }

  let allDeleted = true;

  for (const result of results) {
    if (!result.fileName) {
      console.error(
        "Cannot delete temporary processed image: Cloudinary public ID is missing",
      );

      allDeleted = false;
      continue;
    }

    try {
      const cloudinaryResult = await deleteFromCloudinary(result.fileName);

      if (cloudinaryResult?.result === "ok") {
        console.log(`Temporary processed image deleted: ${result.fileName}`);
      } else {
        console.error(
          `Cloudinary deletion was not confirmed: ${result.fileName}`,
        );

        allDeleted = false;
      }
    } catch (error) {
      console.error(
        `Failed to delete temporary processed image: ${result.fileName}`,
        error.message,
      );

      allDeleted = false;
    }
  }

  return allDeleted;
};

export const cleanupCloudinaryImages = async (images = []) => {
  if (!images.length) {
    return true;
  }

  let allDeleted = true;

  for (const image of images) {
    if (!image.publicId) {
      console.error(
        "Cannot delete temporary image: Cloudinary public ID is missing",
      );

      allDeleted = false;
      continue;
    }

    try {
      const result = await deleteFromCloudinary(image.publicId);

      if (result?.result === "ok") {
        console.log(`Temporary Cloudinary image deleted: ${image.publicId}`);
      } else {
        console.error(
          `Cloudinary deletion was not confirmed: ${image.publicId}`,
        );

        allDeleted = false;
      }
    } catch (error) {
      allDeleted = false;

      console.error(
        `Failed to delete Cloudinary image ${image.publicId}:`,
        error.message,
      );
    }
  }

  return allDeleted;
};

export const cleanupExpiredProcessingBatches = async () => {
  const expiredBatches = await ProcessingBatch.find({
    cleanupAt: {
      $ne: null,
      $lte: new Date(),
    },
  });

  console.log(`Found ${expiredBatches.length} expired processing batch(es)`);

  for (const batch of expiredBatches) {
    try {
      // Delete temporary original images
      const originalsDeleted = await cleanupCloudinaryImages(batch.images);

      // Delete temporary processed images
      const resultsDeleted = await cleanupProcessedImages(batch.results);

      // Only remove MongoDB document if every Cloudinary
      // deletion was successful.
      if (!originalsDeleted || !resultsDeleted) {
        console.error(
          `Some Cloudinary images could not be deleted for batch ${batch._id}`,
        );

        continue;
      }

      const deletedBatch = await ProcessingBatch.findByIdAndDelete(batch._id);

      if (deletedBatch) {
        console.log(`Processing batch deleted from MongoDB: ${batch._id}`);
      } else {
        console.log(`Processing batch was already deleted: ${batch._id}`);
      }
    } catch (error) {
      console.error(`Failed to clean batch ${batch._id}:`, error.message);
    }
  }
};
