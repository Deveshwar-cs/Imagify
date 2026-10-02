import "dotenv/config";
import stripe from "../src/config/stripe.js";

const advanceTestClock = async () => {
  try {
    const testClock = await stripe.testHelpers.testClocks.advance(
      "clock_1UM16fA0BnWwUOATBr8CpuIg",
      {
        frozen_time: Math.floor(
          new Date("2026-11-02T09:42:12.000Z").getTime() / 1000,
        ),
      },
    );

    console.log("Test Clock advanced:");
    console.log("ID:", testClock.id);
    console.log("Status:", testClock.status);
    console.log("Frozen time:", new Date(testClock.frozen_time * 1000));
  } catch (error) {
    console.error("Failed to advance Test Clock:", error.message);
  }
};

advanceTestClock();
