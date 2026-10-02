import sharp from "sharp";
import Image from "../models/image.models.js";
import cloudinary from "../config/cloudinary.js";
import imageQueue from "../queue/image.queue.js";
import ProcessingBatch from "../models/processing.batch.model.js";
import {deleteFromCloudinary} from "../services/image.service.js";
import {
  GUEST_IMAGE_LIMIT,
  PLAN_PROCESSING_LIMITS,
} from "../config/usage.config.js";
import {
  reserveGuestUsage,
  reserveUserUsage,
  releaseGuestUsage,
  releaseUserUsage,
} from "../services/usage.service.js";
import {sendPushNotification} from "../services/push.services.js";
import PushSubscription from "../models/push.subscription.model.js";
import {uploadBufferToCloudinary} from "../services/image.service.js";

import fs from "fs/promises";

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

  let imageCount = 0;

  const uploadedPublicIds = [];

  try {
    // ============================================================
    // Read request data
    // ============================================================

    const {operation} = req.body;
    /*
     * Because this request is multipart/form-data,
     * options arrives as a string:
     *
     * options = '{"width":"800","height":"","maintainAspectRatio":true}'
     *
     * So we need to convert it back into a JavaScript object.
     */

    let options = {};

    try {
      options =
        typeof req.body.options === "string"
          ? JSON.parse(req.body.options)
          : (req.body.options ?? {});
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid processing options",
      });
    }

    const allowedOperations = ["resize", "compress", "quality", "upscale"];

    // ============================================================
    // Validate uploaded files
    // ============================================================

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image",
      });
    }

    // ============================================================
    // Validate operation
    // ============================================================

    if (!allowedOperations.includes(operation)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image processing operation",
      });
    }

    imageCount = req.files.length;

    // ============================================================
    // Check processing usage
    // ============================================================

    let reservation;
    let limit;

    if (req.user) {
      limit = PLAN_PROCESSING_LIMITS[req.user.subscription?.plan] ?? 0;

      if (limit === 0) {
        return res.status(403).json({
          success: false,
          message: "An active subscription plan is required to process images.",
        });
      }

      reservation = await reserveUserUsage(req.user._id, imageCount, limit);
    } else {
      if (!req.guestId) {
        return res.status(400).json({
          success: false,
          message: "Guest identity could not be established",
        });
      }
      limit = GUEST_IMAGE_LIMIT;
      reservation = await reserveGuestUsage(req.guestId, imageCount);
    }

    // ============================================================
    // Check whether processing limit was exceeded
    // ============================================================

    if (!reservation.success) {
      const used = reservation.usage?.processCount ?? 0;

      const remaining = Math.max(limit - used, 0);

      return res.status(429).json({
        success: false,

        message: req.user
          ? `You have reached your ${limit}-image processing limit.`
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

    // ============================================================
    // Upload temporary originals directly to Cloudinary
    // ============================================================

    const batchImages = [];

    for (const file of req.files) {
      // ----------------------------------------------------------
      // Get original image dimensions
      // ----------------------------------------------------------

      const metadata = await sharp(file.buffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error(
          `Unable to determine dimensions for ${file.originalname}`,
        );
      }

      // ----------------------------------------------------------
      // Upload buffer directly to Cloudinary
      // ----------------------------------------------------------

      const cloudinaryResult = await uploadBufferToCloudinary(
        file.buffer,
        "imagify/processing/originals",
      );

      uploadedPublicIds.push(cloudinaryResult.public_id);

      // ----------------------------------------------------------
      // Store information required by the batch
      // ----------------------------------------------------------

      batchImages.push({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        width: metadata.width,
        height: metadata.height,
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
      });
    }

    // ============================================================
    // Create processing batch
    // ============================================================

    batch = await ProcessingBatch.create({
      user: req.user?._id || null,
      guestId: req.guestId || null,

      status: "processing",

      images: batchImages,

      results: [],

      totalImages: imageCount,

      completedImages: 0,

      failedImages: 0,

      notificationSent: false,

      operation,

      options,
    });

    // ============================================================
    // Add processing jobs to BullMQ
    // ============================================================
    for (const image of batchImages) {
      const job = await imageQueue.add("process-image", {
        sourceUrl: image.url,
        sourcePublicId: image.publicId,
        originalName: image.originalName,
        mimeType: image.mimeType,
        size: image.size,
        operation,
        options,
        batchId: batch._id.toString(),
      });
      console.log(job);
      jobs.push(job);
    }

    // ============================================================
    // Calculate usage information
    // ============================================================

    const used = reservation.usage?.processCount ?? 0;

    const remaining = Math.max(limit - used, 0);

    // ============================================================
    // Response
    // ============================================================

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

    // ============================================================
    // Remove BullMQ jobs if something failed
    // ============================================================

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

    for (const publicId of uploadedPublicIds) {
      try {
        await deleteFromCloudinary(publicId);
      } catch (cloudinaryError) {
        console.error(
          `Failed to delete Cloudinary file ${publicId}:`,
          cloudinaryError.message,
        );
      }
    }

    // ============================================================
    // Delete processing batch if it was created
    // ============================================================

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

    // ============================================================
    // Roll back reserved processing usage
    // ============================================================

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

    // ============================================================
    // Response
    // ============================================================

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
    });

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

        images: batch.images,
        results: batch.results,
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
    console.log(subscription);
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
