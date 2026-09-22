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
    await ProcessingBatch.findByIdAndUpdate(batchId, {
      $inc: {
        completedImages: 1,
      },
    });

    const batch = await ProcessingBatch.findById(batchId);

    if (batch && batch.completedImages === batch.totalImages) {
      batch.status = "completed";

      await batch.save();

      console.log(`Batch ${batchId} completed`);

      const subscriptions = await PushSubscription.find();

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
              body: `${batch.totalImages} image${
                batch.totalImages > 1 ? "s are" : " is"
              } ready to download.`,
              url: `/?batch=${batch._id}`,
            },
          );

          console.log(`Push notification sent for batch ${batchId}`);
        } catch (error) {
          console.error(
            `Push notification failed for subscription ${subscription._id}:`,
            error.message,
          );
        }
      }
    }

    console.log(`Job ${job.id} completed`);

    return {
      success: true,
      message: "Image processing job completed",
    };
  },
  {connection: redisConnection},
);

const startWorker = async () => {
  await connectDB();

  console.log("Image processing worker started");
};

startWorker();

imageWorker.on("completed", (job) => {
  console.log(`Worker completed job ${job.id}`);
});

imageWorker.on("failed", async (job, error) => {
  console.error(`Worker failed job ${job?.id}:`, error.message);

  if (!job?.data?.batchId) {
    return;
  }

  try {
    const batch = await ProcessingBatch.findById(job.data.batchId);

    if (!batch) {
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

console.log("Image processing worker started");
