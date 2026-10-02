import {Queue} from "bullmq";

import redisConnection from "../config/redis.js";

const imageQueue = new Queue("process-image", {
  connection: redisConnection,

  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
  },
});

export default imageQueue;
