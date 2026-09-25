import stripe from "../config/stripe.js";
import User from "../models/user.model.js";
import {SUBSCRIPTION_PLANS} from "../config/subscription.plan.js";

export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;

  // --------------------------------------------------
  // 1. Verify Stripe webhook
  // --------------------------------------------------

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed:",
      error.message,
    );

    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // --------------------------------------------------
  // 2. Process event
  // --------------------------------------------------

  try {
    switch (event.type) {
      // ==================================================
      // CHECKOUT COMPLETED
      // ==================================================

      case "checkout.session.completed": {
        const session = event.data.object;

        const userId = session.metadata?.userId;

        if (!userId) {
          console.error("No userId found in checkout session metadata");
          break;
        }

        const subscriptionId = session.subscription;
        const customerId = session.customer;

        if (!subscriptionId) {
          console.error("No subscription ID found in checkout session");
          break;
        }

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        const priceId = subscription.items.data[0]?.price?.id;

        const matchedPlan = Object.entries(SUBSCRIPTION_PLANS).find(
          ([, plan]) => plan.priceId === priceId,
        );

        const plan = matchedPlan?.[0];

        if (!plan) {
          console.error(
            "Unable to determine plan from checkout subscription:",
            priceId,
          );
          break;
        }

        const currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null;

        await User.findByIdAndUpdate(
          userId,
          {
            "subscription.plan": plan,
            "subscription.status":
              subscription.status === "active" ? "active" : subscription.status,

            "subscription.stripeCustomerId": customerId,
            "subscription.stripeSubscriptionId": subscriptionId,

            "subscription.currentPeriodEnd": currentPeriodEnd,

            "subscription.cancelAtPeriodEnd": false,

            "subscription.scheduledPlan": "none",
            "subscription.scheduledPlanDate": null,
          },
          {
            new: true,
          },
        );

        console.log(`Subscription activated for user ${userId}: ${plan}`);

        break;
      }

      // ==================================================
      // SUBSCRIPTION UPDATED
      // ==================================================

      case "customer.subscription.updated": {
        const subscription = event.data.object;

        console.log("Stripe subscription updated:", subscription.id);

        const user = await User.findOne({
          "subscription.stripeSubscriptionId": subscription.id,
        });

        if (!user) {
          console.log("User not found for subscription:", subscription.id);
          break;
        }

        // --------------------------------------------------
        // Determine CURRENT plan
        // --------------------------------------------------

        const priceId = subscription.items.data[0]?.price?.id;

        const matchedPlan = Object.entries(SUBSCRIPTION_PLANS).find(
          ([, plan]) => plan.priceId === priceId,
        );

        const currentPlan = matchedPlan?.[0];

        if (!currentPlan) {
          console.log("Unable to determine subscription plan:", priceId);
          break;
        }

        // --------------------------------------------------
        // Determine cancellation state
        //
        // Your application uses Subscription Schedules,
        // so cancel_at_period_end alone is not enough.
        // --------------------------------------------------

        let cancelAtPeriodEnd = subscription.cancel_at_period_end;

        if (subscription.schedule) {
          try {
            const schedule = await stripe.subscriptionSchedules.retrieve(
              subscription.schedule,
            );

            console.log(
              "Subscription schedule:",
              schedule.id,
              "end_behavior:",
              schedule.end_behavior,
            );

            if (schedule.end_behavior === "cancel") {
              cancelAtPeriodEnd = true;
            } else if (schedule.end_behavior === "release") {
              cancelAtPeriodEnd = false;
            }
          } catch (scheduleError) {
            console.error(
              "Unable to retrieve subscription schedule:",
              scheduleError.message,
            );
          }
        }

        // --------------------------------------------------
        // Update subscription information
        // --------------------------------------------------

        user.subscription.plan = currentPlan;

        user.subscription.status =
          subscription.status === "active" ? "active" : subscription.status;

        user.subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;

        user.subscription.currentPeriodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null;

        // --------------------------------------------------
        // IMPORTANT:
        //
        // Only remove scheduledPlan when the CURRENT plan
        // actually becomes the scheduled plan.
        //
        // Example:
        //
        // premium -> starter scheduled
        //
        // Current plan = premium
        // scheduledPlan = starter
        //
        // Do NOT clear starter yet.
        //
        // Later Stripe changes current plan to starter.
        // Then clear scheduledPlan.
        // --------------------------------------------------

        if (
          user.subscription.scheduledPlan &&
          user.subscription.scheduledPlan !== "none" &&
          user.subscription.scheduledPlan === currentPlan
        ) {
          console.log(`Scheduled plan ${currentPlan} is now active.`);

          user.subscription.scheduledPlan = "none";
          user.subscription.scheduledPlanDate = null;
        }

        await user.save();

        console.log(`Subscription updated for user ${user._id}:`, {
          currentPlan,
          cancelAtPeriodEnd,
          scheduledPlan: user.subscription.scheduledPlan,
        });

        break;
      }

      // ==================================================
      // SUBSCRIPTION DELETED
      // ==================================================

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        const user = await User.findOne({
          "subscription.stripeSubscriptionId": subscription.id,
        });

        if (!user) {
          console.log(
            "User not found for deleted subscription:",
            subscription.id,
          );
          break;
        }

        await User.findByIdAndUpdate(user._id, {
          "subscription.status": "canceled",

          "subscription.cancelAtPeriodEnd": false,

          "subscription.currentPeriodEnd": null,

          "subscription.scheduledPlan": "none",

          "subscription.scheduledPlanDate": null,
        });

        console.log(`Subscription canceled for user ${user._id}`);

        break;
      }

      // ==================================================
      // PAYMENT FAILED
      // ==================================================

      case "invoice.payment_failed": {
        const invoice = event.data.object;

        const subscriptionId = invoice.subscription;

        if (!subscriptionId) {
          break;
        }

        const user = await User.findOne({
          "subscription.stripeSubscriptionId": subscriptionId,
        });

        if (!user) {
          break;
        }

        await User.findByIdAndUpdate(user._id, {
          "subscription.status": "past_due",
        });

        console.log(`Payment failed for user ${user._id}`);

        break;
      }

      // ==================================================
      // DEFAULT
      // ==================================================

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};
