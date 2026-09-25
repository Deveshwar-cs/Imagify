import {Worker} from "bullmq";

import redisConnection from "../config/redis.js";
import connectDB from "../config/database.js";

import ProcessingBatch from "../models/processing.batch.model.js";
import PushSubscription from "../models/push.subscription.model.js";

import {
  processResize,
  processCompress,
  processQuality,
  processUpscale,
} from "../services/image.processing.service.js";

import {sendPushNotification} from "../services/push.services.js";

const imageWorker = new Worker(
  "image-processing",
  async (job) => {
    const {imageId, operation, options = {}, batchId} = job.data;

    console.log("Processing job:", job.id);
    console.log("Job data:", job.data);

    let result;

    // ============================================================
    // Process image
    // ============================================================

    switch (operation) {
      case "resize":
        result = await processResize(imageId, options.width, options.height);
        break;

      case "compress":
        result = await processCompress(imageId, options.level);
        break;

      case "quality":
        result = await processQuality(imageId);
        break;

      case "upscale":
        result = await processUpscale(imageId, options.scale);
        break;

      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    // ============================================================
    // Update batch after successful image processing
    // ============================================================

    const batch = await ProcessingBatch.findOneAndUpdate(
      {
        _id: batchId,
        status: "processing",
      },
      {
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
          },
        },
        {
          new: true,
        },
      );

      if (completedBatch) {
        console.log(`Batch ${batchId} status updated to ${finalStatus}`);

        // ========================================================
        // Send completion notification
        // ========================================================

        const subscriptions = await PushSubscription.find();

        console.log(`Found ${subscriptions.length} subscription(s)`);

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
                url: `/?batch=${completedBatch._id}`,
              },
            );

            // Remove expired or unsubscribed subscriptions
            if (pushResult?.expired) {
              await PushSubscription.findByIdAndDelete(subscription._id);

              console.log(
                `Removed expired push subscription ${subscription._id}`,
              );

              continue;
            }

            // Notification was successfully sent
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
