export const SUBSCRIPTION_PLANS = {
  starter: {
    name: "Starter",
    limit: 10,
    priceId: process.env.STRIPE_STARTER_PRICE_ID,
  },
  premium: {
    name: "Premium",
    limit: 20,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID,
  },
  enterprise: {
    name: "Enterprise",
    limit: 30,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  },
};
