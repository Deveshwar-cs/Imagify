import "dotenv/config";
import stripe from "../src/config/stripe.js";

const checkSubscription = async () => {
  try {
    const subscription = await stripe.subscriptions.retrieve(
      "sub_1UM0pnA0BnWwUOAT7SjVGm32",
    );

    console.log("Subscription:");
    console.log("ID:", subscription.id);
    console.log("Status:", subscription.status);
    console.log("Test Clock:", subscription.test_clock);
    console.log(
      "Period start:",
      new Date(subscription.items.data[0].current_period_start * 1000),
    );
    console.log(
      "Period end:",
      new Date(subscription.items.data[0].current_period_end * 1000),
    );
  } catch (error) {
    console.error("Failed to retrieve subscription:", error.message);
  }
};

checkSubscription();
