import "dotenv/config";
import stripe from "../src/config/stripe.js";

const createTestClock = async () => {
  try {
    const testClock = await stripe.testHelpers.testClocks.create({
      frozen_time: Math.floor(Date.now() / 1000),
      name: "Imagify Renewal Test",
    });

    console.log("Test Clock created:");
    console.log("ID:", testClock.id);
    console.log("Status:", testClock.status);

    console.log("Frozen time:", new Date(testClock.frozen_time * 1000));
  } catch (error) {
    console.error("Failed to create Test Clock:", error.message);
  }
};

createTestClock();
