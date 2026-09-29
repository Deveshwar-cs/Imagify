import stripe from "../config/stripe.js";
import {SUBSCRIPTION_PLANS} from "../config/subscription.plan.js";

export const createCheckoutSession = async (req, res) => {
  try {
    const {plan} = req.body;
    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Please select a subscription plan",
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan];

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    const user = req.user;

    let customerId = user.subscription?.stripeCustomerId;

    // Create Stripe customer if one doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: user.name,
        email: user.email,
        metadata: {
          userId: user._id.toString(),
        },
      });

      customerId = customer.id;

      user.subscription.stripeCustomerId = customerId;

      await user.save();
    }
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      customer: customerId,

      line_items: [
        {
          price: selectedPlan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/subscription/success`,

      cancel_url: `${process.env.CLIENT_URL}/subscription/cancel`,

      metadata: {
        userId: user._id.toString(),
        plan,
      },

      subscription_data: {
        metadata: {
          userId: user._id.toString(),
          plan,
        },
      },
    });
    return res.status(200).json({
      success: true,
      message: "Checkout session created",
      url: session.url,
    });
  } catch (error) {
    console.error("Create checkout session error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create checkout session",
    });
  }
};

export const changeSubscriptionPlan = async (req, res) => {
  try {
    const {plan} = req.body;

    if (!plan) {
      return res.status(400).json({
        success: false,
        message: "Please select a subscription plan",
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan];

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    const user = req.user;

    const currentPlan = user.subscription?.plan;

    if (!currentPlan) {
      return res.status(400).json({
        success: false,
        message: "No current subscription plan found",
      });
    }

    if (currentPlan === plan) {
      return res.status(400).json({
        success: false,
        message: "You are already on this plan",
      });
    }

    const planLevels = {
      starter: 1,
      premium: 2,
      enterprise: 3,
    };

    const currentLevel = planLevels[currentPlan];
    const newLevel = planLevels[plan];

    if (newLevel < currentLevel) {
      return res.status(400).json({
        success: false,
        message: "Downgrades are handled separately.",
      });
    }

    const subscriptionId = user.subscription?.stripeSubscriptionId;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "No active subscription found",
      });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active subscriptions can be changed",
      });
    }

    const subscriptionItem = subscription.items.data[0];

    if (!subscriptionItem) {
      return res.status(400).json({
        success: false,
        message: "Subscription item not found",
      });
    }

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        items: [
          {
            id: subscriptionItem.id,
            price: selectedPlan.priceId,
          },
        ],

        proration_behavior: "always_invoice",

        metadata: {
          userId: user._id.toString(),
          plan,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Subscription upgrade processed successfully",

      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
      },
    });
  } catch (error) {
    console.error("Change subscription plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to change subscription plan",
    });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    const user = req.user;
    const subscription = user.subscription;

    if (!subscription) {
      return res.status(200).json({
        success: true,
        subscription: null,
      });
    }

    let cancelAtPeriodEnd = subscription.cancelAtPeriodEnd;

    let currentPeriodEnd = subscription.currentPeriodEnd;

    // --------------------------------------------
    // Sync state from Stripe
    // --------------------------------------------

    if (subscription.stripeSubscriptionId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId,
        );

        if (stripeSubscription.schedule) {
          const schedule = await stripe.subscriptionSchedules.retrieve(
            stripeSubscription.schedule,
          );

          // ------------------------------------------
          // Cancellation state
          // ------------------------------------------

          if (schedule.end_behavior === "cancel") {
            cancelAtPeriodEnd = true;
          } else if (schedule.end_behavior === "release") {
            cancelAtPeriodEnd = false;
          }

          // ------------------------------------------
          // Current period end
          // ------------------------------------------

          if (schedule.current_phase?.end_date) {
            currentPeriodEnd = new Date(schedule.current_phase.end_date * 1000);
          }
        }
      } catch (stripeError) {
        console.error("Stripe subscription sync error:", stripeError.message);
      }
    }

    // --------------------------------------------
    // Save synchronized values
    // --------------------------------------------

    subscription.cancelAtPeriodEnd = cancelAtPeriodEnd;

    subscription.currentPeriodEnd = currentPeriodEnd;

    await user.save();

    // --------------------------------------------
    // Plan information
    // --------------------------------------------

    const planConfig = SUBSCRIPTION_PLANS[subscription.plan];

    return res.status(200).json({
      success: true,

      subscription: {
        plan: subscription.plan,

        planName: planConfig?.name || "No Plan",

        limit: planConfig?.limit || 0,

        status: subscription.status,

        stripeCustomerId: subscription.stripeCustomerId,

        stripeSubscriptionId: subscription.stripeSubscriptionId,

        currentPeriodEnd: currentPeriodEnd,

        cancelAtPeriodEnd: cancelAtPeriodEnd,

        scheduledPlan: subscription.scheduledPlan,

        scheduledPlanDate: subscription.scheduledPlanDate,
      },
    });
  } catch (error) {
    console.error("Get subscription status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get subscription status",
    });
  }
};

export const restoreSubscription = async (req, res) => {
  try {
    const user = req.user;

    const subscriptionId = user.subscription?.stripeSubscriptionId;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "No subscription found",
      });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active subscriptions can be restored",
      });
    }

    // --------------------------------------------
    // Case 1: Subscription Schedule exists
    // --------------------------------------------

    if (subscription.schedule) {
      const schedule = await stripe.subscriptionSchedules.retrieve(
        subscription.schedule,
      );

      if (schedule.end_behavior === "cancel") {
        await stripe.subscriptionSchedules.update(subscription.schedule, {
          end_behavior: "release",
        });

        return res.status(200).json({
          success: true,
          message: "Subscription cancellation has been removed",
        });
      }
    }

    // --------------------------------------------
    // Case 2: Normal cancel_at_period_end
    // --------------------------------------------

    if (subscription.cancel_at_period_end) {
      const updatedSubscription = await stripe.subscriptions.update(
        subscriptionId,
        {
          cancel_at_period_end: false,
        },
      );

      return res.status(200).json({
        success: true,
        message: "Subscription cancellation has been removed",

        subscription: {
          id: updatedSubscription.id,
          status: updatedSubscription.status,
          cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,
        },
      });
    }

    return res.status(400).json({
      success: false,
      message: "Subscription is not scheduled for cancellation",
    });
  } catch (error) {
    console.error("Restore subscription error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to restore subscription",
    });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const user = req.user;

    const subscriptionId = user.subscription?.stripeSubscriptionId;

    console.log("Subscription ID:", subscriptionId);

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "No active subscription found",
      });
    }

    // -----------------------------------------
    // Get Stripe subscription
    // -----------------------------------------

    let subscription = await stripe.subscriptions.retrieve(subscriptionId);

    console.log("Subscription status:", subscription.status);

    if (subscription.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active subscriptions can be canceled",
      });
    }

    // -----------------------------------------
    // Check if already scheduled for cancellation
    // -----------------------------------------

    if (subscription.cancel_at_period_end) {
      return res.status(200).json({
        success: true,
        message: "Subscription is already scheduled for cancellation",

        cancelAtPeriodEnd: true,

        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      });
    }

    // -----------------------------------------
    // Check if subscription is managed by a schedule
    // -----------------------------------------

    const scheduleId =
      typeof subscription.schedule === "string"
        ? subscription.schedule
        : subscription.schedule?.id;

    console.log("Subscription schedule:", scheduleId);

    // -----------------------------------------
    // Release subscription schedule
    // -----------------------------------------

    if (scheduleId) {
      console.log("Releasing subscription schedule:", scheduleId);

      await stripe.subscriptionSchedules.release(scheduleId);

      console.log("Subscription schedule released");

      // Retrieve subscription again because the
      // Stripe subscription object has changed.
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    }

    // -----------------------------------------
    // Cancel subscription at period end
    // -----------------------------------------

    const updatedSubscription = await stripe.subscriptions.update(
      subscriptionId,
      {
        cancel_at_period_end: true,
      },
    );

    console.log(
      "Subscription cancellation scheduled:",
      updatedSubscription.cancel_at_period_end,
    );

    // -----------------------------------------
    // Update MongoDB
    // -----------------------------------------

    user.subscription.cancelAtPeriodEnd = true;

    // Once the subscription is being canceled,
    // there should be no scheduled plan change.
    user.subscription.scheduledPlan = "none";

    user.subscription.scheduledPlanDate = null;

    await user.save();

    // -----------------------------------------
    // Response
    // -----------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Subscription will be canceled at the end of the current billing period",

      cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end,

      currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cancel subscription",
    });
  }
};

export const scheduleDowngrade = async (req, res) => {
  try {
    const {plan} = req.body;

    if (!plan) {
      return res.status(404).json({
        success: false,
        messsage: "Please select a subscription plan",
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan];

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    const user = req.user;
    const currentPlan = user.subscription.plan;

    if (!currentPlan) {
      return res.status(400).json({
        success: false,
        message: "No current subscription plan found",
      });
    }

    if (currentPlan === plan) {
      return res.status(400).json({
        success: false,
        message: "You are already on this plan",
      });
    }

    const planLevels = {
      starter: 1,
      premium: 2,
      enterprise: 3,
    };

    const currentLevel = planLevels[currentPlan];
    const newLevel = planLevels[plan];

    if (!currentLevel || !newLevel) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan configuration",
      });
    }

    if (newLevel >= currentLevel) {
      return res.status(400).json({
        success: false,
        message: "This endpoint is only for downgrades",
      });
    }
    const subscriptionId = user.subscription?.stripeSubscriptionId;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "No active subscription found!",
      });
    }
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    // Checking subscription status
    if (subscription.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active subscriptions can be changed",
      });
    }

    const currentItem = subscription.items.data[0];
    console.log("Current item:--");
    console.log(currentItem);

    if (!currentItem) {
      return res.status(400).json({
        success: false,
        message: "Subscription item not found",
      });
    }

    const scheduleId =
      typeof subscription.schedule === "string"
        ? subscription.schedule
        : subscription.schedule?.id;
    let schedule;
    if (scheduleId) {
      schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);

      // console.log(
      //   "Existing Stripe schedule:",
      //   JSON.stringify(schedule, null, 2),
      // );

      if (schedule.status !== "active" && schedule.status !== "not_started") {
        return res.status(400).json({
          success: false,
          message: "Subscription schedule cannot be modified",
        });
      }

      const currentPhase = schedule.current_phase;

      if (!currentPhase) {
        return res.status(400).json({
          success: false,
          message: "current subscription phase not found",
        });
      }

      const currentPhaseStart = currentPhase.start_date;
      const currentPhaseEnd = currentPhase.end_date;

      if (!currentPhaseEnd) {
        return res.status(400).json({
          success: false,
          message: "Current subscription phase does not have an end date",
        });
      }

      schedule = await stripe.subscriptionSchedules.update(scheduleId, {
        end_behavior: "release",
        phases: [
          {
            start_date: currentPhaseStart,
            end_date: currentPhaseEnd,

            items: [
              {
                price: currentItem.price.id,
                quantity: currentItem.quantity || 1,
              },
            ],
          },

          {
            start_date: currentPhaseEnd,
            items: [
              {
                price: selectedPlan.priceId,
                quantity: 1,
              },
            ],
          },
        ],
      });
    } else {
      schedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscriptionId,
      });
      // console.log(
      //   "Created Stripe schedule:",
      //   JSON.stringify(schedule, null, 2),
      // );

      const currentPhase = schedule.current_phase;

      if (!currentPhase) {
        return res.status(400).json({
          success: false,
          message: "Current subscription phase not found",
        });
      }

      const currentPhaseStart = currentPhase.start_date;
      const currentPhaseEnd = currentPhase.end_date;

      if (!currentPhaseEnd) {
        return res.status(400).json({
          success: false,
          message: "Current subscription phase does not have an end date",
        });
      }

      schedule = await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: "release",
        phases: [
          {
            start_date: currentPhaseStart,
            end_date: currentPhaseEnd,
            items: [
              {
                price: currentItem.price.id,
                quantity: currentItem.quantity || 1,
              },
            ],
          },

          {
            start_date: currentPhaseEnd,
            items: [
              {
                price: selectedPlan.priceId,
                quantity: 1,
              },
            ],
          },
        ],
      });
    }

    user.subscription.scheduledPlan = plan;

    user.subscription.scheduledPlanDate = new Date(
      schedule.phases[1].start_date * 1000,
    );

    await user.save();
    return res.status(200).json({
      success: true,

      message: `Your subscription will change to ${selectedPlan.name} at the end of the current billing period.`,

      schedule: {
        id: schedule.id,
        status: schedule.status,
      },

      scheduledPlan: plan,

      scheduledPlanDate: user.subscription.scheduledPlanDate,
    });
  } catch (error) {
    console.error("Schedule downgrade error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to schedule subscription downgrade",
    });
  }
};

export const cancelScheduledPlan = async (req, res) => {
  try {
    const user = req.user;

    const subscriptionId = user.subscription?.stripeSubscriptionId;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: "No active subscription found",
      });
    }

    // Get Stripe subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (subscription.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active subscriptions can be modified",
      });
    }

    // Get Stripe subscription schedule
    const scheduleId =
      typeof subscription.schedule === "string"
        ? subscription.schedule
        : subscription.schedule?.id;

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        message: "Subscription schedule not found",
      });
    }

    // Release the subscription from the schedule
    const releasedSchedule =
      await stripe.subscriptionSchedules.release(scheduleId);

    console.log("Subscription schedule released:", releasedSchedule.id);

    // Clear scheduled plan from database
    user.subscription.scheduledPlan = "none";
    user.subscription.scheduledPlanDate = null;

    await user.save();

    console.log("Scheduled plan cancelled successfully");

    return res.status(200).json({
      success: true,
      message: "Scheduled plan change has been canceled",
      scheduledPlan: "none",
      scheduledPlanDate: null,
    });
  } catch (error) {
    console.error("Cancel scheduled plan error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel scheduled plan change",
    });
  }
};

export const previewSubscriptionUpgrade = async (req, res) => {
  try {
    const {plan} = req.body;
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Please select subscription plan",
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[plan];

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    const user = req.user;

    const currentPlan = user.subscription?.plan;

    if (!currentPlan) {
      return res.status(400).json({
        success: false,
        message: "No current subscription plan found",
      });
    }

    // Make sure this endpoint is only used for upgrades
    const planLevels = {starter: 1, premium: 2, enterprise: 3};
    const currentLevel = planLevels[currentPlan];
    const newLevel = planLevels[plan];
    if (newLevel <= currentLevel) {
      return res
        .status(400)
        .json({success: false, message: "This plan is not an upgrade"});
    }
    const subscriptionId = user.subscription?.stripeSubscriptionId;
    if (!subscriptionId) {
      return res
        .status(400)
        .json({success: false, message: "No active subscription found"});
    }
    // Get current Stripe subscription
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "Only active subscriptions can be upgraded",
      });
    }
    const subscriptionItem = subscription.items.data[0];
    if (!subscriptionItem) {
      return res
        .status(400)
        .json({success: false, message: "Subscription item not found"});
    }

    const invoice = await stripe.invoices.createPreview({
      customer: subscription.customer,
      subscription: subscriptionId,
      subscription_details: {
        items: [
          {
            id: subscriptionItem.id,
            price: selectedPlan.priceId,
          },
        ],
        proration_behavior: "always_invoice",
      },
    });

    // Stripe amounts are represented in the smallest currency unit.
    const amountDue = invoice.amount_due;
    const currency = invoice.currency;
    return res.status(200).json({
      success: true,
      preview: {
        plan,
        currentPlan,
        amountDue,
        currency,
        // Convenient value for displaying to the user.
        amountDueFormatted: `${(amountDue / 100).toFixed(2)} ${currency.toUpperCase()}`,
        invoiceId: invoice.id,
      },
    });
  } catch (error) {
    console.error("Preview subscription upgrade error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to preview subscription upgrade",
    });
  }
};
