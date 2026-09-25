import express from "express";

import {
  createCheckoutSession,
  changeSubscriptionPlan,
  getSubscriptionStatus,
  cancelSubscription,
  restoreSubscription,
  scheduleDowngrade,
  cancelScheduledPlan,
} from "../controllers/subscription.controller.js";

import {authenticateUser} from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/status", authenticateUser, getSubscriptionStatus);

router.post("/checkout", authenticateUser, createCheckoutSession);

router.post("/change-plan", authenticateUser, changeSubscriptionPlan);

router.post("/downgrade", authenticateUser, scheduleDowngrade);

router.post("/cancel-scheduled-plan", authenticateUser, cancelScheduledPlan);

router.post("/cancel", authenticateUser, cancelSubscription);

router.post("/restore", authenticateUser, restoreSubscription);

export default router;
