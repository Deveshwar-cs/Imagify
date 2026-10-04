import {Worker} from "bullmq";

import redisConnection from "../config/redis.js";

import connectDB from "../config/database.js";

import cleanupQueue from "../queue/cleanup.queue.js";

import {cleanupExpiredProcessingBatches} from "../services/image.service.js";

const cleanupWorker = new Worker(
  "processing-cleanup",
  async (job) => {
    console.log(`Cleanup job started: ${job.id}`);

    await cleanupExpiredProcessingBatches();

    console.log(`Cleanup job completed: ${job.id}`);

    return {success: true, message: "Expired processing batches cleaned"};
  },
  {connection: redisConnection},
);

const startCleanupWorker = async () => {
  try {
    await connectDB();
    await cleanupQueue.upsertJobScheduler(
      "processing-cleanup-scheduler",
      {every: 60 * 60 * 1000},
      {name: "cleanup-expired-processing"},
    );
    console.log("Processing cleanup worker started");
  } catch (error) {
    console.error("Failed to start processing cleanup worker:", error);
    process.exit(1);
  }
};

startCleanupWorker();
cleanupWorker.on("completed", (job) => {
  console.log(`Cleanup job ${job.id} completed`);
});
cleanupWorker.on("failed", (job, error) => {
  console.error(`Cleanup job ${job?.id} failed:`, error.message);
});
cleanupWorker.on("error", (error) => {
  console.error("Cleanup worker error:", error);
});
export default cleanupWorker;
