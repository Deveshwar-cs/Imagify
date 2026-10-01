import sharp from "sharp";
import Image from "../models/image.models.js";
import fs from "fs/promises";
import cloudinary from "../config/cloudinary.js";
import imageQueue from "../queue/image.queue.js";
import ProcessingBatch from "../models/processing.batch.model.js";
import {
  GUEST_IMAGE_LIMIT,
  PLAN_PROCESSING_LIMITS,
  PLAN_STORAGE_LIMITS,
  GUEST_STORAGE_LIMIT,
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
 * Queue Image Processing
 * --------------------------------------------------------------------------
 */
export const queueImageProcessing = async (req, res) => {
  let reservationCreated = false;
  let batch = null;
  const jobs = [];

  // Declared here (outside the try) so the catch block's rollback
  // can still see the correct reserved amount even if something
  // throws partway through.
  let imageCount = 0;

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

    imageCount = images.length;

    // -----------------------------
    // RESERVE USAGE ATOMICALLY
    // -----------------------------

    let reservation;
    let limit;

    if (req.user) {
      // Authenticated user — limit now comes from their subscription plan
      limit = PLAN_PROCESSING_LIMITS[req.user.subscription?.plan] ?? 0;

      if (limit === 0) {
        return res.status(403).json({
          success: false,
          message: "An active subscription plan is required to process images.",
        });
      }

      reservation = await reserveUserUsage(req.user._id, imageCount, limit);
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
    // (fixed: release exactly what was reserved — imageCount —
    // instead of jobs.length, which could be lower on a partial failure)
    // -----------------------------

    if (reservationCreated && imageCount > 0) {
      try {
        if (req.user) {
          await releaseUserUsage(req.user._id, imageCount);
        } else if (req.guestId) {
          await releaseGuestUsage(req.guestId, imageCount);
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
