import "dotenv/config";
import stripe from "../src/config/stripe.js";

const checkTestClock = async () => {
  try {
    const testClock = await stripe.testHelpers.testClocks.retrieve(
      "clock_1ULywrA0BnWwUOATVYB42QL1",
    );

    console.log("Test Clock:");
    console.log("ID:", testClock.id);
    console.log("Status:", testClock.status);
    console.log("Frozen time:", new Date(testClock.frozen_time * 1000));
  } catch (error) {
    console.error("Failed to retrieve Test Clock:", error.message);
  }
};

checkTestClock();
