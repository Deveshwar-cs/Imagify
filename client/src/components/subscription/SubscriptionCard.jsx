import {useEffect, useState} from "react";

import {
  getSubscriptionStatus,
  changeSubscriptionPlan,
  scheduleDowngrade,
  cancelSubscription,
  restoreSubscription,
} from "../../services/subscription.service";

const SubscriptionCard = ({onSubscriptionUpdated}) => {
  const [subscription, setSubscription] = useState(null);

  const [restoring, setRestoring] = useState(false);

  const [canceling, setCanceling] = useState(false);

  const [changingPlan, setChangingPlan] = useState(null);

  const [downgradingPlan, setDowngradingPlan] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // -----------------------------------------
  // Load subscription
  // -----------------------------------------

  const loadSubscription = async () => {
    try {
      const data = await getSubscriptionStatus();

      setSubscription(data.subscription);

      return data.subscription;
    } catch (error) {
      console.error("Failed to refresh subscription:", error);

      return null;
    }
  };

  // -----------------------------------------
  // Wait for subscription update
  // -----------------------------------------

  const waitForSubscriptionUpdate = async (checkUpdate) => {
    const maxAttempts = 10;
    const delay = 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const updatedSubscription = await loadSubscription();

      console.log(
        `Subscription update check ${attempt}/${maxAttempts}:`,
        updatedSubscription,
      );

      if (updatedSubscription && checkUpdate(updatedSubscription)) {
        console.log("Subscription successfully updated.");

        return true;
      }

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return false;
  };

  // -----------------------------------------
  // Upgrade plan
  // -----------------------------------------

  const handleChangePlan = async (plan) => {
    const currentPlan = subscription?.planName || "current plan";

    const confirmed = window.confirm(
      `Are you sure you want to upgrade from ${currentPlan} to ${plan}? Stripe will calculate and charge the applicable prorated amount.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setChangingPlan(plan);
      setError("");

      const response = await changeSubscriptionPlan(plan);

      if (!response.success) {
        throw new Error(
          response.message || "Failed to change subscription plan.",
        );
      }

      const updated = await waitForSubscriptionUpdate(
        (subscription) => subscription.plan === plan,
      );

      if (!updated) {
        setError(
          "Your upgrade is still being processed. Please check again shortly.",
        );

        return;
      }

      onSubscriptionUpdated?.();
    } catch (error) {
      console.error("Change subscription plan error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to upgrade subscription.",
      );
    } finally {
      setChangingPlan(null);
    }
  };

  // -----------------------------------------
  // Schedule downgrade
  // -----------------------------------------

  const handleDowngrade = async (plan) => {
    const currentPlan = subscription?.planName || "current plan";

    const confirmed = window.confirm(
      `Are you sure you want to switch from ${currentPlan} to ${plan}? Your current plan will remain active until the end of your billing period.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDowngradingPlan(plan);
      setError("");

      const response = await scheduleDowngrade(plan);

      if (!response.success) {
        throw new Error(response.message || "Failed to schedule downgrade.");
      }

      await loadSubscription();

      onSubscriptionUpdated?.();
    } catch (error) {
      console.error("Schedule downgrade error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to schedule downgrade.",
      );
    } finally {
      setDowngradingPlan(null);
    }
  };

  // -----------------------------------------
  // Cancel subscription
  // -----------------------------------------

  const handleCancelSubscription = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel your subscription? Your current plan will remain active until the end of your billing period.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setCanceling(true);
      setError("");

      const response = await cancelSubscription();

      if (!response.success) {
        throw new Error(response.message || "Failed to cancel subscription.");
      }

      const updated = await waitForSubscriptionUpdate(
        (subscription) => subscription.cancelAtPeriodEnd === true,
      );

      if (!updated) {
        setError(
          "Cancellation is still being processed. Please check again shortly.",
        );

        return;
      }

      onSubscriptionUpdated?.();
    } catch (error) {
      console.error("Cancel subscription error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to cancel subscription.",
      );
    } finally {
      setCanceling(false);
    }
  };

  // -----------------------------------------
  // Restore subscription cancellation
  // -----------------------------------------

  const handleRestoreSubscription = async () => {
    try {
      setRestoring(true);
      setError("");

      const response = await restoreSubscription();

      if (!response.success) {
        throw new Error(response.message || "Failed to restore subscription.");
      }

      const updated = await waitForSubscriptionUpdate(
        (subscription) => subscription.cancelAtPeriodEnd === false,
      );

      if (!updated) {
        setError(
          "Subscription restoration is still being processed. Please check again shortly.",
        );

        return;
      }

      onSubscriptionUpdated?.();
    } catch (error) {
      console.error("Restore subscription error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to restore subscription.",
      );
    } finally {
      setRestoring(false);
    }
  };

  // -----------------------------------------
  // Initial subscription load
  // -----------------------------------------

  useEffect(() => {
    const loadInitialSubscription = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getSubscriptionStatus();

        console.log("Initial subscription:", data.subscription);

        setSubscription(data.subscription);
      } catch (error) {
        console.error("Load subscription error:", error);

        setError(
          error.response?.data?.message || "Failed to load subscription.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadInitialSubscription();
  }, []);

  // -----------------------------------------
  // Loading UI
  // -----------------------------------------

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Loading subscription...</p>
      </div>
    );
  }

  // -----------------------------------------
  // Error UI
  // -----------------------------------------

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  // -----------------------------------------
  // Plan levels
  // -----------------------------------------

  const planLevels = {
    starter: 1,
    premium: 2,
    enterprise: 3,
  };

  // -----------------------------------------
  // UI
  // -----------------------------------------

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Current plan</p>

          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {subscription.planName}
          </h2>
        </div>

        <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium capitalize text-green-700">
          {subscription.status}
        </span>
      </div>

      {/* Scheduled Plan Change */}

      {subscription.scheduledPlan && subscription.scheduledPlan !== "none" && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Scheduled plan change
          </p>

          <p className="mt-1 text-sm text-amber-700">
            Your plan will change from{" "}
            <span className="font-semibold">{subscription.planName}</span> to{" "}
            <span className="font-semibold capitalize">
              {subscription.scheduledPlan}
            </span>
            .
          </p>

          {subscription.scheduledPlanDate && (
            <p className="mt-1 text-sm text-amber-700">
              Effective on{" "}
              {new Date(subscription.scheduledPlanDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Subscription Information */}

      <div className="mt-6 grid grid-cols-3 gap-4">
        {/* Image Limit */}

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Image limit</p>

          <p className="mt-1 text-xl font-semibold text-slate-900">
            {subscription.limit}
          </p>
        </div>

        {/* Cancellation */}

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Cancellation</p>

          <p className="mt-1 text-xl font-semibold text-slate-900">
            {subscription.cancelAtPeriodEnd ? "Scheduled" : "Active"}
          </p>
        </div>

        {/* Stripe Subscription */}

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Subscription</p>

          <p className="mt-1 text-xl font-semibold text-slate-900">
            {subscription.stripeSubscriptionId ? "Connected" : "Not connected"}
          </p>
        </div>
      </div>

      {/* Cancel Subscription */}

      {subscription.status === "active" && !subscription.cancelAtPeriodEnd && (
        <button
          onClick={handleCancelSubscription}
          disabled={
            canceling ||
            changingPlan !== null ||
            downgradingPlan !== null ||
            restoring
          }
          className="mt-6 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {canceling ? "Canceling..." : "Cancel Subscription"}
        </button>
      )}

      {/* Restore Subscription */}

      {subscription.status === "active" && subscription.cancelAtPeriodEnd && (
        <button
          onClick={handleRestoreSubscription}
          disabled={
            restoring ||
            changingPlan !== null ||
            downgradingPlan !== null ||
            canceling
          }
          className="mt-6 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {restoring ? "Restoring..." : "Restore Subscription"}
        </button>
      )}

      {/* Change Plan */}

      {subscription.status === "active" && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-slate-700">Change plan</p>

          <div className="flex flex-wrap gap-3">
            {["starter", "premium", "enterprise"].map((plan) => {
              const currentLevel = planLevels[subscription.plan];

              const selectedLevel = planLevels[plan];

              const isCurrentPlan = subscription.plan === plan;

              const isUpgrade = selectedLevel > currentLevel;

              const isDowngrade = selectedLevel < currentLevel;

              const hasScheduledPlan =
                subscription.scheduledPlan &&
                subscription.scheduledPlan !== "none";

              return (
                <button
                  key={plan}
                  onClick={() => {
                    if (isUpgrade) {
                      handleChangePlan(plan);
                    }

                    if (isDowngrade) {
                      handleDowngrade(plan);
                    }
                  }}
                  disabled={
                    changingPlan !== null ||
                    downgradingPlan !== null ||
                    canceling ||
                    restoring ||
                    isCurrentPlan ||
                    hasScheduledPlan
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium capitalize text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {changingPlan === plan
                    ? "Processing..."
                    : downgradingPlan === plan
                      ? "Scheduling..."
                      : isCurrentPlan
                        ? "Current Plan"
                        : isUpgrade
                          ? `Upgrade to ${plan}`
                          : `Switch to ${plan}`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionCard;
