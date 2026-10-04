import {Worker} from "bullmq";

import redisConnection from "../config/redis.js";

import connectDB from "../config/database.js";

import ProcessingBatch from "../models/processing.batch.model.js";

import PushSubscription from "../models/push.subscription.model.js";

import {deleteFromCloudinary} from "../services/image.service.js";

import {
  processResize,
  processCompress,
  processQuality,
  processUpscale,
} from "../services/image.processing.service.js";

import {sendPushNotification} from "../services/push.services.js";

const imageWorker = new Worker(
  "process-image",

  async (job) => {
    const {
      sourceUrl,
      sourcePublicId,
      originalName,
      mimeType,
      operation,
      options = {},
      batchId,
    } = job.data;

    let result;

    // ============================================================
    // Process image
    // ============================================================

    switch (operation) {
      case "resize":
        result = await processResize(
          sourceUrl,
          mimeType,
          options.width,
          options.height,
        );
        break;

      case "compress":
        result = await processCompress(sourceUrl, mimeType, options.level);
        break;

      case "quality":
        result = await processQuality(sourceUrl, mimeType);
        break;

      case "upscale":
        result = await processUpscale(sourceUrl, mimeType, options.scale);
        break;

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    // ============================================================
    // Save processing result to batch
    // ============================================================

    const batch = await ProcessingBatch.findOneAndUpdate(
      {
        _id: batchId,
        status: "processing",
      },
      {
        $push: {
          results: {
            originalName,
            operation: result.operation,
            fileName: result.fileName,
            url: result.url,
            size: result.size,
            width: result.width,
            height: result.height,
            mimeType: result.mimeType,
          },
        },

        $inc: {
          completedImages: 1,
        },
      },
      {
        new: true,
      },
    );

    if (!batch) {
      throw new Error(`Processing batch not found: ${batchId}`);
    }
    console.log(
      `Batch ${batchId}: ${batch.completedImages}/${batch.totalImages} completed`,
    );

    // ============================================================
    // Check whether the entire batch has finished
    // ============================================================

    const processedImages = batch.completedImages + batch.failedImages;

    if (processedImages >= batch.totalImages) {
      console.log(`Batch ${batchId} has finished processing`);

      const finalStatus = batch.failedImages > 0 ? "failed" : "completed";
      const completedBatch = await ProcessingBatch.findOneAndUpdate(
        {
          _id: batchId,
          status: "processing",
          notificationSent: false,
        },
        {
          $set: {
            status: finalStatus,
            notificationSent: true,
            cleanupAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        },
        {
          new: true,
        },
      );

      if (completedBatch) {
        // ========================================================
        // Send completion notification
        // ========================================================

        const subscriptions = await PushSubscription.find();

        for (const subscription of subscriptions) {
          try {
            const pushResult = await sendPushNotification(
              {
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: subscription.keys.p256dh,
                  auth: subscription.keys.auth,
                },
              },
              {
                title: "Imagify",

                body:
                  completedBatch.status === "completed"
                    ? `${completedBatch.totalImages} image${
                        completedBatch.totalImages > 1 ? "s are" : " is"
                      } ready to download.`
                    : "Image processing finished with some failed images.",

                url: `/notification?batch=${completedBatch._id}`,
              },
            );

            // ====================================================
            // Remove expired subscriptions
            // ====================================================

            if (pushResult?.expired) {
              await PushSubscription.findByIdAndDelete(subscription._id);

              console.log(
                `Removed expired push subscription ${subscription._id}`,
              );

              continue;
            }

            // ====================================================
            // Notification successfully sent
            // ====================================================

            if (pushResult?.success) {
              console.log(
                `Push notification sent to subscription ${subscription._id}`,
              );
            }
          } catch (error) {
            console.error(
              `Push notification failed to subscription ${subscription._id}:`,
              error.message,
            );
          }
        }
      } else {
        console.log(`Batch ${batchId} was already finalized.`);
      }
    }

    console.log(`Job ${job.id} completed`);

    return {
      success: true,
      message: "Image processing job completed",
      result,
    };
  },

  {
    connection: redisConnection,
  },
);

// ================================================================
// Worker startup
// ================================================================

const startWorker = async () => {
  try {
    await connectDB();

    console.log("Image processing worker started");
  } catch (error) {
    console.error("Failed to start worker:", error);

    process.exit(1);
  }
};

startWorker();

// ================================================================
// Failed job
// ================================================================

imageWorker.on("failed", async (job, error) => {
  console.error(`Worker failed for job ${job?.id}:`, error.message);

  if (!job?.data?.batchId) {
    return;
  }

  //job still has retry attempts remaning
  if (job.attemptsMade < job.opts.attempts) {
    console.log(
      `Job ${job.id} will be retried. ` +
        `Attempt ${job.attemptsMade}/${job.opts.attempts}`,
    );

    return;
  }

  if (job.data.sourcePublicId) {
    try {
      await deleteFromCloudinary(job.data.sourcePublicId);

      console.log(
        `Deleted temporary Cloudinary original: ${job.data.sourcePublicId}`,
      );
    } catch (cloudinaryError) {
      console.error(
        `Failed to delete temporary Cloudinary original ${job.data.sourcePublicId}:`,
        cloudinaryError.message,
      );
    }
  }
  try {
    const batch = await ProcessingBatch.findOneAndUpdate(
      {
        _id: job.data.batchId,
        status: "processing",
      },
      {
        $inc: {
          failedImages: 1,
        },
      },
      {
        new: true,
      },
    );

    if (!batch) {
      console.error(`Batch not found: ${job.data.batchId}`);

      return;
    }

    console.log(
      `Batch ${batch._id}: ${batch.completedImages} completed, ${batch.failedImages} failed`,
    );

    // ============================================================
    // Check whether the entire batch has finished
    // ============================================================

    const processedImages = batch.completedImages + batch.failedImages;

    if (processedImages >= batch.totalImages) {
      const completedBatch = await ProcessingBatch.findOneAndUpdate(
        {
          _id: batch._id,
          status: "processing",
          notificationSent: false,
        },
        {
          $set: {
            status: "failed",
            notificationSent: true,
          },
        },
        {
          new: true,
        },
      );

      if (completedBatch) {
        console.log(`Batch ${completedBatch._id} finalized as failed.`);
      }
    }
  } catch (batchError) {
    console.error("Failed to update batch:", batchError.message);
  }
});

// ================================================================
// Worker errors
// ================================================================

imageWorker.on("error", (error) => {
  console.error("Image worker error:", error);
});

export default imageWorker;
