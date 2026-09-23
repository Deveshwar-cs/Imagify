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

    // -----------------------------
    // PROCESS IMAGE
    // -----------------------------

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

    // -----------------------------
    // UPDATE COMPLETED IMAGES
    // -----------------------------

    const batch = await ProcessingBatch.findByIdAndUpdate(
      batchId,
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

    // -----------------------------
    // CHECK BATCH COMPLETION
    // -----------------------------

    const processedImages = batch.completedImages + batch.failedImages;

    if (processedImages >= batch.totalImages) {
      console.log(`Batch ${batchId} has finished processing`);

      // -----------------------------
      // MARK BATCH COMPLETE ONCE
      // -----------------------------

      const completedBatch = await ProcessingBatch.findOneAndUpdate(
        {
          _id: batchId,

          // Only one job can change this
          // from false to true.
          notificationSent: false,
        },
        {
          $set: {
            status: batch.failedImages > 0 ? "failed" : "completed",

            notificationSent: true,
          },
        },
        {
          new: true,
        },
      );

      // -----------------------------
      // SEND NOTIFICATION ONLY ONCE
      // -----------------------------

      if (completedBatch) {
        console.log(`Sending completion notification for batch ${batchId}`);

        const subscriptions = await PushSubscription.find();

        console.log(`Found ${subscriptions.length} subscription(s)`);

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

                body:
                  completedBatch.status === "completed"
                    ? `${completedBatch.totalImages} image${
                        completedBatch.totalImages > 1 ? "s are" : " is"
                      } ready to download.`
                    : "Image processing finished with some failed images.",

                url: `/?batch=${completedBatch._id}`,
              },
            );

            console.log(
              `Push notification sent to subscription ${subscription._id}`,
            );
          } catch (error) {
            console.error(
              `Push notification failed for subscription ${subscription._id}:`,
              error.message,
            );
          }
        }
      } else {
        console.log(`Notification already sent for batch ${batchId}`);
      }
    }

    // -----------------------------
    // JOB COMPLETED
    // -----------------------------

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

// -----------------------------
// START WORKER
// -----------------------------

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

// -----------------------------
// COMPLETED EVENT
// -----------------------------

imageWorker.on("completed", (job) => {
  console.log(`Worker completed job ${job.id}`);
});

// -----------------------------
// FAILED EVENT
// -----------------------------

imageWorker.on("failed", async (job, error) => {
  console.error(`Worker failed job ${job?.id}:`, error.message);

  if (!job?.data?.batchId) {
    return;
  }

  try {
    const batch = await ProcessingBatch.findById(job.data.batchId);

    if (!batch) {
      console.error(`Batch not found: ${job.data.batchId}`);

      return;
    }

    batch.failedImages += 1;

    const processedImages = batch.completedImages + batch.failedImages;

    if (processedImages >= batch.totalImages) {
      batch.status = "failed";
    }

    await batch.save();

    console.log(
      `Batch ${batch._id}: ${batch.completedImages} completed, ${batch.failedImages} failed`,
    );
  } catch (batchError) {
    console.error("Failed to update batch:", batchError.message);
  }
});
