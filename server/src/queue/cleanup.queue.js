import {Queue} from "bullmq";
import redisConnection from "../config/redis.js";

const cleanupQueue = new Queue("processing-cleanup", {
  connection: redisConnection,
});

export default cleanupQueue;
