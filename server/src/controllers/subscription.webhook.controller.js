import stripe from "../config/stripe.js";
import User from "../models/user.model.js";
import {SUBSCRIPTION_PLANS} from "../config/subscription.plan.js";

const resetUsageForNewBillingPeriod = async (userId, currentPeriodEnd) => {
  await User.findByIdAndUpdate(userId, {
    "usage.processCount": 0,
    "usage.resetAt": currentPeriodEnd,
  });

  console.log(
    `Usage reset for user ${userId}. New reset date: ${currentPeriodEnd}`,
  );
};

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
        // Object.enteries give key value pairs:- we don't need key so, we write it like ([,plan]) for distructuring
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

        // stripe give us time period in second but Date want it in millieseconds

        console.log("Subscription ID:", subscription.id);

        console.log(
          "Subscription current_period_end:",
          subscription.current_period_end,
        );

        console.log(
          "Subscription billing_cycle_anchor:",
          subscription.billing_cycle_anchor,
        );

        console.log("Subscription start_date:", subscription.start_date);

        console.log(
          "Full subscription:",
          JSON.stringify(subscription, null, 2),
        );

        const currentPeriodEndTimestamp =
          subscription.items.data[0]?.current_period_end;

        const currentPeriodEnd = currentPeriodEndTimestamp
          ? new Date(currentPeriodEndTimestamp * 1000)
          : null;

        console.log("currentPeriodEnd:", currentPeriodEnd);

        const user = await User.findByIdAndUpdate(
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

            "usage.processCount": 0,
            "usage.resetAt": currentPeriodEnd,
          },
          {
            new: true,
          },
        );
        console.log(user);
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
      // INVOICE PAID
      // ==================================================
      case "invoice.paid": {
        const invoice = event.data.object;
        console.log(invoice);
        console.log("========== invoice.paid ==========");
        console.log("Invoice ID:", invoice.id);
        console.log("Billing reason:", invoice.billing_reason);
        console.log(
          "Subscription ID:",
          invoice.parent?.subscription_details?.subscription,
        );
        console.log("Customer ID:", invoice.customer);
        console.log("=================================");

        const subscriptionId =
          invoice.parent?.subscription_details?.subscription;

        if (!subscriptionId) {
          console.log("No subscription ID found in invoice:", invoice.id);
          break;
        }

        if (!subscriptionId) {
          break;
        }

        // We only want to reset usage when a subscription
        // billing periods successfully renews

        if (invoice.billing_reason !== "subscription_cycle") {
          break;
        }

        const user = await User.findOne({
          "subscription.stripeSubscriptionId": subscriptionId,
        });

        if (!user) {
          console.log("User not found for invoice:", invoice.id);
        }

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        const subscriptionItem = subscription.items.data[0];

        if (!subscriptionItem) {
          console.log("Subscription item not found:", subscriptionId);
          break;
        }

        const currentPeriodEndTimestamp = subscriptionItem.current_period_end;

        const currentPeriodEnd = currentPeriodEndTimestamp
          ? new Date(currentPeriodEndTimestamp * 1000)
          : null;

        await resetUsageForNewBillingPeriod(user._id, currentPeriodEnd);

        // keep subscription period information synchronized
        user.subscription.currentPeriodEnd = currentPeriodEnd;

        user.subscription.status =
          subscription.status === "active" ? "active" : subscription.status;

        await user.save();
        console.log(`Subscription renewed for user ${user._id}`);
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
