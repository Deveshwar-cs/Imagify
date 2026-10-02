import "dotenv/config";

import mongoose from "mongoose";
import stripe from "../src/config/stripe.js";
import User from "../src/models/user.model.js";

const TEST_CLOCK_ID = "clock_1UM16fA0BnWwUOATBr8CpuIg";

const USER_ID = "6abf602e0985f1828666c140";

// Premium price
const PRICE_ID = "price_1UIkvnA0BnWwUOATTVftrBO2";

// This does NOT need to be a MongoDB user's email.
const TEST_EMAIL = "renewal-test@example.com";

const createTestSubscription = async () => {
  try {
    // =========================================
    // 1. Connect to MongoDB
    // =========================================

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");

    // =========================================
    // 2. Verify MongoDB user exists
    // =========================================

    const user = await User.findById(USER_ID);

    if (!user) {
      throw new Error(`MongoDB user not found: ${USER_ID}`);
    }

    console.log("MongoDB user found:", user._id);

    // =========================================
    // 3. Create customer attached to Test Clock
    // =========================================

    const customer = await stripe.customers.create({
      name: "Imagify Renewal Test",
      email: TEST_EMAIL,
      test_clock: TEST_CLOCK_ID,
    });

    console.log("Customer created:");
    console.log("Customer ID:", customer.id);
    console.log("Test Clock:", customer.test_clock);

    // =========================================
    // 4. Create Stripe test payment method
    // =========================================

    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: "tok_visa",
      },
    });

    console.log("Payment method created:");
    console.log("Payment Method ID:", paymentMethod.id);

    // =========================================
    // 5. Attach payment method
    // =========================================

    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    });

    console.log("Payment method attached.");

    // =========================================
    // 6. Set default payment method
    // =========================================

    await stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    console.log("Default payment method set.");

    // =========================================
    // 7. Create Stripe subscription
    // =========================================

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,

      items: [
        {
          price: PRICE_ID,
        },
      ],

      payment_behavior: "error_if_incomplete",

      metadata: {
        purpose: "imagify-renewal-test",
        userId: USER_ID,
      },
    });

    console.log("");
    console.log("========================================");
    console.log("TEST SUBSCRIPTION CREATED");
    console.log("========================================");

    console.log("Customer ID:", customer.id);

    console.log("Payment Method:", paymentMethod.id);

    console.log("Subscription ID:", subscription.id);

    console.log("Status:", subscription.status);

    console.log("Test Clock:", subscription.test_clock);

    // =========================================
    // 8. Get subscription period
    // =========================================

    const subscriptionItem = subscription.items.data[0];

    if (!subscriptionItem) {
      throw new Error("Subscription item not found.");
    }

    const currentPeriodEnd = subscriptionItem.current_period_end
      ? new Date(subscriptionItem.current_period_end * 1000)
      : null;

    console.log(
      "Period start:",
      new Date(subscriptionItem.current_period_start * 1000),
    );

    console.log("Period end:", currentPeriodEnd);

    // =========================================
    // 9. Link Stripe subscription to MongoDB
    // =========================================

    user.subscription.plan = "premium";

    user.subscription.status =
      subscription.status === "active" ? "active" : subscription.status;

    user.subscription.stripeCustomerId = customer.id;

    user.subscription.stripeSubscriptionId = subscription.id;

    user.subscription.currentPeriodEnd = currentPeriodEnd;

    user.subscription.cancelAtPeriodEnd = false;

    user.subscription.scheduledPlan = "none";

    user.subscription.scheduledPlanDate = null;

    // Give us a visible value to test renewal.
    user.usage.processCount = 5;

    user.usage.resetAt = currentPeriodEnd;

    await user.save();

    console.log("");
    console.log("========================================");
    console.log("MONGODB USER LINKED");
    console.log("========================================");

    console.log("User ID:", user._id);

    console.log("Stripe Customer:", user.subscription.stripeCustomerId);

    console.log("Stripe Subscription:", user.subscription.stripeSubscriptionId);

    console.log("Plan:", user.subscription.plan);

    console.log("Status:", user.subscription.status);

    console.log("Process Count:", user.usage.processCount);

    console.log("Reset At:", user.usage.resetAt);

    console.log("========================================");
  } catch (error) {
    console.error("Failed to create test subscription:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createTestSubscription();
