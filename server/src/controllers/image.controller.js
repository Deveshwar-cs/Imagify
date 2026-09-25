import sharp from "sharp";
import Image from "../models/image.models.js";
import fs from "fs/promises";
import cloudinary from "../config/cloudinary.js";
import imageQueue from "../queue/image.queue.js";
import ProcessingBatch from "../models/processing.batch.model.js";
import {
  GUEST_IMAGE_LIMIT,
  AUTHENTICATED_IMAGE_LIMIT,
} from "../config/usage.config.js";
import {
  reserveGuestUsage,
  reserveUserUsage,
  releaseGuestUsage,
  releaseUserUsage,
} from "../services/usage.service.js";
import {sendPushNotification} from "../services/push.services.js";
import {
  createTempFilePath,
  uploadToCloudinary,
  downloadImageToTemp,
  cleanupTempFile,
} from "../services/image.service.js";
import PushSubscription from "../models/push.subscription.model.js";

/**
 * --------------------------------------------------------------------------
 * Helper: Build owner query
 * --------------------------------------------------------------------------
 *
 * Logged-in user:
 *   { user: userId, guestId: null }
 *
 * Guest:
 *   { user: null, guestId: guestId }
 *
 */
const getOwnerQuery = (req) => {
  if (req.user) {
    return {
      user: req.user._id,
      guestId: null,
    };
  }

  return {
    user: null,
    guestId: req.guestId,
  };
};

/**
 * --------------------------------------------------------------------------
 * Upload Image
 * --------------------------------------------------------------------------
 */
export const uploadImage = async (req, res) => {
  try {
    console.log("Uploaded files:", req.files);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const metadata = await sharp(file.buffer).metadata();

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "imagify/originals",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );

        uploadStream.end(file.buffer);
      });

      const image = await Image.create({
        // Logged-in user OR guest
        user: req.user?._id || null,
        guestId: req.guestId || null,

        originalName: file.originalname,
        fileName: result.public_id,
        mimeType: file.mimetype,
        size: file.size,
        width: metadata.width,
        height: metadata.height,
        url: result.secure_url,
      });

      uploadedImages.push({
        id: image._id,
        originalName: image.originalName,
        fileName: image.fileName,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height,
        url: image.url,
      });
    }

    return res.status(201).json({
      success: true,
      message: `${uploadedImages.length} image${
        uploadedImages.length > 1 ? "s" : ""
      } uploaded successfully`,
      images: uploadedImages,
    });
  } catch (error) {
    console.error("Upload image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload image",
    });
  }
};

/**
 * --------------------------------------------------------------------------
 * Resize Image
 * --------------------------------------------------------------------------
 */
export const resizeImage = async (req, res) => {
  let inputPath;
  let outputPath;

  try {
    const {imageId} = req.params;
    const {width, height} = req.body;

    if (!width && !height) {
      return res.status(400).json({
        success: false,
        message: "Width or height is required",
      });
    }

    const image = await Image.findOne({
      _id: imageId,
      ...getOwnerQuery(req),
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const parsedWidth = width ? Number(width) : null;
    const parsedHeight = height ? Number(height) : null;

    if (
      (width !== undefined &&
        width !== "" &&
        (!Number.isFinite(parsedWidth) || parsedWidth <= 0)) ||
      (height !== undefined &&
        height !== "" &&
        (!Number.isFinite(parsedHeight) || parsedHeight <= 0))
    ) {
      return res.status(400).json({
        success: false,
        message: "Width and height must be valid positive numbers",
      });
    }

    inputPath = await downloadImageToTemp(image.url);

    const extensionMap = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = extensionMap[image.mimeType] || ".jpg";

    outputPath = createTempFilePath(extension);

    const resizeOptions = {};

    if (parsedWidth) {
      resizeOptions.width = parsedWidth;
    }

    if (parsedHeight) {
      resizeOptions.height = parsedHeight;
    }

    await sharp(inputPath)
      .resize({
        ...resizeOptions,
        fit: "inside",
        withoutEnlargement: false,
      })
      .toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();
    const stats = await fs.stat(outputPath);

    const result = await uploadToCloudinary(
      outputPath,
      "imagify/processed/resize",
    );

    const processedImage = {
      operation: "resize",
      fileName: result.public_id,
      url: result.secure_url,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${metadata.format}`,
    };

    image.processedImages.push(processedImage);

    await image.save();

    return res.status(200).json({
      success: true,
      message: "Image resized successfully",

      original: {
        fileName: image.fileName,
        size: image.size,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        url: image.url,
      },

      processed: {
        ...processedImage,
        url: result.secure_url,
      },
    });
  } catch (error) {
    console.error("Resize image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resize image",
    });
  } finally {
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};

/**
 * --------------------------------------------------------------------------
 * Compress Image
 * --------------------------------------------------------------------------
 */
export const compressImage = async (req, res) => {
  let inputPath;
  let outputPath;

  try {
    const {imageId} = req.params;
    const {level = "medium"} = req.body;

    const image = await Image.findOne({
      _id: imageId,
      ...getOwnerQuery(req),
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const compressionLevels = {
      low: {
        quality: 80,
      },
      medium: {
        quality: 60,
      },
      high: {
        quality: 40,
      },
    };

    const compression = compressionLevels[level];

    if (!compression) {
      return res.status(400).json({
        success: false,
        message: "Invalid compression level",
      });
    }

    inputPath = await downloadImageToTemp(image.url);

    const extensionMap = {
      "image/jpeg": ".jpeg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = extensionMap[image.mimeType] || ".jpeg";

    outputPath = createTempFilePath(extension);

    let imageProcessor = sharp(inputPath);

    switch (image.mimeType) {
      case "image/jpeg":
        imageProcessor = imageProcessor.jpeg({
          quality: compression.quality,
          mozjpeg: true,
        });
        break;

      case "image/png":
        imageProcessor = imageProcessor.png({
          compressionLevel: 9,
          palette: level === "high",
        });
        break;

      case "image/webp":
        imageProcessor = imageProcessor.webp({
          quality: compression.quality,
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Unsupported image format",
        });
    }

    await imageProcessor.toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();
    const stats = await fs.stat(outputPath);

    const result = await uploadToCloudinary(
      outputPath,
      "imagify/processed/compress",
    );

    const processedImage = {
      operation: "compress",
      fileName: result.public_id,
      url: result.secure_url,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${metadata.format}`,
    };

    image.processedImages.push(processedImage);

    await image.save();

    return res.status(200).json({
      success: true,
      message: "Image compressed successfully",

      original: {
        fileName: image.fileName,
        size: image.size,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        url: image.url,
      },

      processed: {
        ...processedImage,
        url: result.secure_url,
      },
    });
  } catch (error) {
    console.error("Compress image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to compress image",
    });
  } finally {
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};

/**
 * --------------------------------------------------------------------------
 * Improve Quality
 * --------------------------------------------------------------------------
 */
export const improveQuality = async (req, res) => {
  let inputPath;
  let outputPath;

  try {
    const {imageId} = req.params;

    const image = await Image.findOne({
      _id: imageId,
      ...getOwnerQuery(req),
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    inputPath = await downloadImageToTemp(image.url);

    const extensionMap = {
      "image/jpeg": ".jpeg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = extensionMap[image.mimeType] || ".jpeg";

    outputPath = createTempFilePath(extension);

    await sharp(inputPath)
      .sharpen({
        sigma: 1.2,
        m1: 1,
        m2: 2,
      })
      .toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();
    const stats = await fs.stat(outputPath);

    const result = await uploadToCloudinary(
      outputPath,
      "imagify/processed/quality",
    );

    const processedImage = {
      operation: "quality",
      fileName: result.public_id,
      url: result.secure_url,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${metadata.format}`,
    };

    image.processedImages.push(processedImage);

    await image.save();

    return res.status(200).json({
      success: true,
      message: "Image quality improved successfully",

      original: {
        fileName: image.fileName,
        size: image.size,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        url: image.url,
      },

      processed: {
        ...processedImage,
        url: result.secure_url,
      },
    });
  } catch (error) {
    console.error("Improve quality error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to improve quality",
    });
  } finally {
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};

/**
 * --------------------------------------------------------------------------
 * Upscale Image
 * --------------------------------------------------------------------------
 */
export const upscaleImage = async (req, res) => {
  let inputPath;
  let outputPath;

  try {
    const {imageId} = req.params;
    const {scale = 2} = req.body;

    const image = await Image.findOne({
      _id: imageId,
      ...getOwnerQuery(req),
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const parsedScale = Number(scale);

    if (![2, 3].includes(parsedScale)) {
      return res.status(400).json({
        success: false,
        message: "Scale must be either 2 or 3",
      });
    }

    inputPath = await downloadImageToTemp(image.url);

    const extensionMap = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = extensionMap[image.mimeType] || ".jpg";

    outputPath = createTempFilePath(extension);

    const newWidth = image.width * parsedScale;
    const newHeight = image.height * parsedScale;

    await sharp(inputPath)
      .resize({
        width: newWidth,
        height: newHeight,
        fit: "fill",
      })
      .toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();
    const stats = await fs.stat(outputPath);

    const result = await uploadToCloudinary(
      outputPath,
      `imagify/processed/upscale/${parsedScale}x`,
    );

    const processedImage = {
      operation: `upscale-${parsedScale}x`,
      fileName: result.public_id,
      url: result.secure_url,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${metadata.format}`,
    };

    image.processedImages.push(processedImage);

    await image.save();

    return res.status(200).json({
      success: true,
      message: `Image upscaled ${parsedScale}x successfully`,

      original: {
        fileName: image.fileName,
        size: image.size,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        url: image.url,
      },

      processed: {
        ...processedImage,
        url: result.secure_url,
      },
    });
  } catch (error) {
    console.error("Upscale image error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to upscale image",
    });
  } finally {
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};

/**
 * --------------------------------------------------------------------------
 * Queue Image Processing
 * --------------------------------------------------------------------------
 */
export const queueImageProcessing = async (req, res) => {
  let reservationCreated = false;
  let batch = null;
  const jobs = [];

  try {
    const {imageIds, operation, options = {}} = req.body;
    const allowedOperations = ["resize", "compress", "quality", "upscale"];

    // -----------------------------
    // VALIDATE INPUT
    // -----------------------------

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one image",
      });
    }

    if (!allowedOperations.includes(operation)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image processing operation",
      });
    }

    // Prevent duplicate image IDs in the same request
    const uniqueImageIds = [...new Set(imageIds.map(String))];
    if (uniqueImageIds.length !== imageIds.length) {
      return res.status(400).json({
        success: false,
        message: "Duplicate image IDs are not allowed",
      });
    }

    // -----------------------------
    // FIND ONLY OWNED IMAGES
    // -----------------------------

    const images = await Image.find({
      _id: {
        $in: uniqueImageIds,
      },
      ...getOwnerQuery(req),
    });

    if (images.length !== uniqueImageIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more images were not found",
      });
    }

    const imageCount = images.length;

    // -----------------------------
    // RESERVE USAGE ATOMICALLY
    // -----------------------------

    let reservation;
    let limit;

    if (req.user) {
      // Authenticated user
      limit = AUTHENTICATED_IMAGE_LIMIT;

      reservation = await reserveUserUsage(req.user._id, imageCount);
    } else {
      // Guest
      if (!req.guestId) {
        return res.status(400).json({
          success: false,
          message: "Guest identity could not be established",
        });
      }

      limit = GUEST_IMAGE_LIMIT;

      reservation = await reserveGuestUsage(req.guestId, imageCount);
    }

    // -----------------------------
    // USAGE LIMIT REACHED
    // -----------------------------

    if (!reservation.success) {
      const used = reservation.usage?.usageCount || 0;
      const remaining = Math.max(limit - used, 0);

      return res.status(429).json({
        success: false,
        message: req.user
          ? `You have reached your ${limit}-image limit.`
          : `Guest users can process up to ${limit} images. Please login with Google to continue.`,

        usage: {
          used,
          limit,
          remaining,
        },

        requiresLogin: !req.user,
      });
    }

    reservationCreated = true;

    // -----------------------------
    // CREATE PROCESSING BATCH
    // -----------------------------

    batch = await ProcessingBatch.create({
      user: req.user?._id || null,
      guestId: req.guestId || null,

      imageIds: images.map((image) => image._id),

      totalImages: imageCount,

      operation,
      options,

      status: "processing",
    });
    // -----------------------------
    // ADD JOBS TO BULLMQ
    // -----------------------------

    for (const image of images) {
      const job = await imageQueue.add("process-image", {
        imageId: image._id.toString(),
        operation,
        options,
        batchId: batch._id.toString(),
      });

      jobs.push(job);
    }

    // -----------------------------
    // USAGE AFTER RESERVATION
    // -----------------------------

    const used = reservation.usage.usageCount || 0;

    const remaining = Math.max(limit - used, 0);

    // -----------------------------
    // RESPONSE
    // -----------------------------

    return res.status(202).json({
      success: true,
      message: "Image processing batch added to queue",

      batchId: batch._id,

      totalImages: imageCount,

      jobIds: jobs.map((job) => job.id),

      operation,

      usage: {
        used,
        limit,
        remaining,
      },
    });
  } catch (error) {
    console.error("Queue image processing error:", error);

    // -----------------------------
    // ROLLBACK BULLMQ JOBS
    // -----------------------------

    for (const job of jobs) {
      try {
        await job.remove();
      } catch (removeError) {
        console.error(
          `Failed to remove BullMQ job ${job.id}:`,
          removeError.message,
        );
      }
    }

    // -----------------------------
    // DELETE FAILED BATCH
    // -----------------------------

    if (batch?._id) {
      try {
        await ProcessingBatch.findByIdAndDelete(batch._id);
      } catch (batchError) {
        console.error(
          "Failed to delete failed processing batch:",
          batchError.message,
        );
      }
    }

    // -----------------------------
    // ROLLBACK RESERVED USAGE
    // -----------------------------

    if (reservationCreated) {
      try {
        if (req.user) {
          await releaseUserUsage(
            req.user._id,
            jobs.length > 0
              ? jobs.length
              : Array.isArray(req.body?.imageIds)
                ? req.body.imageIds.length
                : 0,
          );
        } else if (req.guestId) {
          await releaseGuestUsage(
            req.guestId,
            jobs.length > 0
              ? jobs.length
              : Array.isArray(req.body?.imageIds)
                ? req.body.imageIds.length
                : 0,
          );
        }
      } catch (rollbackError) {
        console.error(
          "Failed to rollback reserved usage:",
          rollbackError.message,
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to queue image processing batch",
    });
  }
};

/**
 * --------------------------------------------------------------------------
 * Get Batch Status
 * --------------------------------------------------------------------------
 */
export const getBatchStatus = async (req, res) => {
  try {
    const {batchId} = req.params;

    const batch = await ProcessingBatch.findOne({
      _id: batchId,
      ...getOwnerQuery(req),
    }).populate("imageIds");
    console.log(getBatchStatus);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Processing batch not found",
      });
    }

    const processedImages = batch.completedImages + batch.failedImages;

    const progress =
      batch.totalImages > 0
        ? Math.round((processedImages / batch.totalImages) * 100)
        : 0;

    return res.status(200).json({
      success: true,

      batch: {
        id: batch._id,
        status: batch.status,
        operation: batch.operation,
        options: batch.options,

        totalImages: batch.totalImages,

        completedImages: batch.completedImages,
        failedImages: batch.failedImages,

        progress,

        images: batch.imageIds,
      },
    });
  } catch (error) {
    console.error("Get batch status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get batch status",
    });
  }
};

/**
 * --------------------------------------------------------------------------
 * Subscribe To Push Notifications
 * --------------------------------------------------------------------------
 */
export const subscribeToPush = async (req, res) => {
  try {
    const {subscription} = req.body;

    if (!subscription?.endpoint) {
      return res.status(400).json({
        success: false,
        message: "Invalid push subscription",
      });
    }

    const savedSubscription = await PushSubscription.findOneAndUpdate(
      {
        endpoint: subscription.endpoint,
      },
      {
        endpoint: subscription.endpoint,

        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(201).json({
      success: true,
      message: "Push subscription saved successfully",
      subscriptionId: savedSubscription._id,
    });
  } catch (error) {
    console.error("Push subscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save push subscription",
    });
  }
};

/**
 * --------------------------------------------------------------------------
 * Test Push Notification
 * --------------------------------------------------------------------------
 */
export const testPushNotification = async (req, res) => {
  try {
    const subscriptions = await PushSubscription.find();

    if (subscriptions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No push subscriptions found",
      });
    }

    const results = [];

    for (const subscription of subscriptions) {
      try {
        await sendPushNotification(
          {
            endpoint: subscription.endpoint,

            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          {
            title: "Imagify",
            body: "Push notifications are working!",
            url: "/",
          },
        );

        results.push({
          subscriptionId: subscription._id,
          success: true,
        });
      } catch (error) {
        results.push({
          subscriptionId: subscription._id,
          success: false,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Test notification sent",
      results,
    });
  } catch (error) {
    console.error("Test push notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send test notification",
    });
  }
};
