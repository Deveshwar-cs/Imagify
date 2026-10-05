import api from "./api";

export const getSubscriptionStatus = async () => {
  const response = await api.get("/subscription/status");

  return response.data;
};

export const changeSubscriptionPlan = async (plan) => {
  const response = await api.post("/subscription/change-plan", {
    plan,
  });

  return response.data;
};

export const scheduleDowngrade = async (plan) => {
  const response = await api.post("/subscription/downgrade", {
    plan,
  });

  return response.data;
};

// -----------------------------------------
// Cancel scheduled downgrade
// -----------------------------------------

export const cancelScheduledPlan = async () => {
  const response = await api.post("/subscription/cancel-scheduled-plan");

  return response.data;
};

export const cancelSubscription = async () => {
  const response = await api.post("/subscription/cancel");

  return response.data;
};

export const restoreSubscription = async () => {
  const response = await api.post("/subscription/restore");

  return response.data;
};

export const createCheckoutSession = async (plan) => {
  const response = await api.post("/subscription/checkout", {
    plan,
  });

  return response.data;
};

export const previewSubscriptionUpgrade = async (plan) => {
  const response = await api.post("/subscription/preview-upgrade", {plan});

  return response.data;
};
