import {useEffect, useState} from "react";

import Modal from "../common/Modal";

import {
  getSubscriptionStatus,
  changeSubscriptionPlan,
  scheduleDowngrade,
  cancelSubscription,
  restoreSubscription,
  cancelScheduledPlan,
  previewSubscriptionUpgrade,
} from "../../services/subscription.service";

const SubscriptionCard = ({onSubscriptionUpdated, onSubscriptionLoaded}) => {
  const [subscription, setSubscription] = useState(null);

  const [cancelingScheduledPlan, setCancelingScheduledPlan] = useState(false);

  const [restoring, setRestoring] = useState(false);

  const [canceling, setCanceling] = useState(false);

  const [changingPlan, setChangingPlan] = useState(null);

  const [downgradingPlan, setDowngradingPlan] = useState(null);

  const [loading, setLoading] = useState(true);

  // Upgrade preview
  const [upgradePreview, setUpgradePreview] = useState(null);

  // Plan currently being previewed
  const [previewingPlan, setPreviewingPlan] = useState(null);

  // Plan selected for downgrade
  const [downgradePlan, setDowngradePlan] = useState(null);

  // Cancel subscription popup
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Restore subscription popup
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const [error, setError] = useState("");

  // -----------------------------------------
  // Load subscription
  // -----------------------------------------

  const loadSubscription = async () => {
    try {
      const data = await getSubscriptionStatus();

      setSubscription(data.subscription);

      onSubscriptionLoaded?.(data.subscription);

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
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
      }
    }

    return false;
  };

  // -----------------------------------------
  // Upgrade plan - preview
  // -----------------------------------------

  const handleChangePlan = async (plan) => {
    try {
      setPreviewingPlan(plan);
      setError("");

      const response = await previewSubscriptionUpgrade(plan);

      if (!response.success) {
        throw new Error(
          response.message || "Failed to preview subscription upgrade.",
        );
      }

      setUpgradePreview(response.preview);
    } catch (error) {
      console.error("Preview subscription upgrade error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to preview subscription upgrade.",
      );
    } finally {
      setPreviewingPlan(null);
    }
  };

  // -----------------------------------------
  // Confirm upgrade
  // -----------------------------------------

  const handleConfirmUpgrade = async () => {
    if (!upgradePreview?.plan) {
      return;
    }

    try {
      const plan = upgradePreview.plan;

      setChangingPlan(plan);
      setError("");

      const response = await changeSubscriptionPlan(plan);

      if (!response.success) {
        throw new Error(
          response.message || "Failed to change subscription plan.",
        );
      }

      setUpgradePreview(null);

      const updated = await waitForSubscriptionUpdate(
        (updatedSubscription) => updatedSubscription.plan === plan,
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
  // Open downgrade popup
  // -----------------------------------------

  const handleDowngrade = (plan) => {
    setError("");
    setDowngradePlan(plan);
  };

  // -----------------------------------------
  // Confirm downgrade
  // -----------------------------------------

  const handleConfirmDowngrade = async () => {
    if (!downgradePlan) {
      return;
    }

    try {
      const plan = downgradePlan;

      setDowngradingPlan(plan);
      setError("");

      const response = await scheduleDowngrade(plan);

      if (!response.success) {
        throw new Error(response.message || "Failed to schedule downgrade.");
      }

      setDowngradePlan(null);

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
  // Open cancel popup
  // -----------------------------------------

  const handleCancelSubscription = () => {
    setError("");
    setShowCancelModal(true);
  };

  // -----------------------------------------
  // Confirm cancellation
  // -----------------------------------------

  const handleConfirmCancel = async () => {
    try {
      setCanceling(true);
      setError("");

      const response = await cancelSubscription();

      if (!response.success) {
        throw new Error(response.message || "Failed to cancel subscription.");
      }

      setShowCancelModal(false);

      const updated = await waitForSubscriptionUpdate(
        (updatedSubscription) => updatedSubscription.cancelAtPeriodEnd === true,
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
  // Open restore popup
  // -----------------------------------------

  const handleRestoreSubscription = () => {
    setError("");
    setShowRestoreModal(true);
  };

  // -----------------------------------------
  // Confirm restore
  // -----------------------------------------

  const handleConfirmRestore = async () => {
    try {
      setRestoring(true);
      setError("");

      const response = await restoreSubscription();

      if (!response.success) {
        throw new Error(response.message || "Failed to restore subscription.");
      }

      setShowRestoreModal(false);

      const updated = await waitForSubscriptionUpdate(
        (updatedSubscription) =>
          updatedSubscription.cancelAtPeriodEnd === false,
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
  // Cancel scheduled plan
  // -----------------------------------------

  const handleCancelScheduledPlan = async () => {
    setError("");

    try {
      setCancelingScheduledPlan(true);

      const response = await cancelScheduledPlan();

      if (!response.success) {
        throw new Error(response.message || "Failed to cancel scheduled plan.");
      }

      await loadSubscription();

      onSubscriptionUpdated?.();
    } catch (error) {
      console.error("Cancel scheduled plan error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to cancel scheduled plan.",
      );
    } finally {
      setCancelingScheduledPlan(false);
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

        onSubscriptionLoaded?.(data.subscription);
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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
        <p className="text-sm text-slate-500">Loading subscription...</p>
      </div>
    );
  }

  // -----------------------------------------
  // Error UI
  // -----------------------------------------

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-6">
        <p className="text-sm leading-5 text-red-600">{error}</p>
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  // -----------------------------------------
  // Scheduled plan
  // -----------------------------------------

  const hasScheduledPlan = subscription.scheduledPlan !== "none";

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
    <>
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Current plan</p>

            <h2 className="mt-1 break-words text-xl font-semibold capitalize text-slate-900 sm:text-2xl">
              {subscription.planName}
            </h2>
          </div>

          <span className="w-fit rounded-full bg-green-50 px-3 py-1 text-sm font-medium capitalize text-green-700">
            {subscription.status}
          </span>
        </div>

        {/* Scheduled Plan Change */}
        {hasScheduledPlan && (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:mt-6">
            <p className="text-sm font-medium text-amber-800">
              Scheduled plan change
            </p>

            <p className="mt-1 text-sm leading-6 text-amber-700">
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

            <button
              onClick={handleCancelScheduledPlan}
              disabled={
                cancelingScheduledPlan ||
                changingPlan !== null ||
                downgradingPlan !== null ||
                canceling ||
                restoring
              }
              className="mt-4 w-full rounded-xl border border-amber-300 px-4 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {cancelingScheduledPlan
                ? "Canceling..."
                : "Cancel Scheduled Change"}
            </button>
          </div>
        )}

        {/* Subscription Information */}
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Image limit</p>

            <p className="mt-1 text-xl font-semibold text-slate-900">
              {subscription.limit}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Cancellation</p>

            <p className="mt-1 text-xl font-semibold text-slate-900">
              {subscription.cancelAtPeriodEnd ? "Scheduled" : "Active"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-sm text-slate-500">Subscription</p>

            <p className="mt-1 break-words text-xl font-semibold text-slate-900">
              {subscription.stripeSubscriptionId
                ? "Connected"
                : "Not connected"}
            </p>
          </div>
        </div>

        {/* Cancel Subscription */}
        {subscription.status === "active" &&
          !subscription.cancelAtPeriodEnd &&
          !hasScheduledPlan && (
            <button
              onClick={handleCancelSubscription}
              disabled={canceling || restoring || cancelingScheduledPlan}
              className="mt-5 w-full rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-6 sm:w-auto"
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
              canceling ||
              cancelingScheduledPlan
            }
            className="mt-5 w-full rounded-xl border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-6 sm:w-auto"
          >
            {restoring ? "Restoring..." : "Restore Subscription"}
          </button>
        )}

        {/* Change Plan */}
        {subscription.status === "active" && (
          <div className="mt-5 sm:mt-6">
            <p className="mb-3 text-sm font-medium text-slate-700">
              Change plan
            </p>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              {["starter", "premium", "enterprise"].map((plan) => {
                const currentLevel = planLevels[subscription.plan];

                const selectedLevel = planLevels[plan];

                const isCurrentPlan = subscription.plan === plan;

                const isUpgrade = selectedLevel > currentLevel;

                const isDowngrade = selectedLevel < currentLevel;

                const isPreviewing = previewingPlan === plan;

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
                      previewingPlan !== null ||
                      canceling ||
                      restoring ||
                      cancelingScheduledPlan ||
                      isCurrentPlan ||
                      hasScheduledPlan
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium capitalize text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {isPreviewing
                      ? "Loading..."
                      : changingPlan === plan
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

      {/* ========================================= */}
      {/* UPGRADE MODAL */}
      {/* ========================================= */}

      <Modal
        isOpen={Boolean(upgradePreview)}
        onClose={() => {
          if (!changingPlan) {
            setUpgradePreview(null);
          }
        }}
        title="Upgrade Subscription"
        description="Review the prorated amount before confirming your upgrade."
      >
        <div className="space-y-3 rounded-xl bg-gray-50 p-3 sm:space-y-4 sm:p-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-gray-500">Current plan</span>

            <span className="font-medium capitalize text-gray-900">
              {upgradePreview?.currentPlan}
            </span>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-gray-500">New plan</span>

            <span className="font-medium capitalize text-gray-900">
              {upgradePreview?.plan}
            </span>
          </div>

          <div className="border-t border-gray-200 pt-3 sm:pt-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-gray-500">Amount due now</span>

              <span className="text-lg font-bold text-gray-900">
                {upgradePreview?.amountDueFormatted}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs leading-5 text-gray-500">
          This amount is based on the prorated adjustment for upgrading during
          your current billing period.
        </p>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={() => setUpgradePreview(null)}
            disabled={changingPlan}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmUpgrade}
            disabled={changingPlan}
            className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            {changingPlan ? "Processing..." : "Confirm Upgrade"}
          </button>
        </div>
      </Modal>

      {/* ========================================= */}
      {/* DOWNGRADE MODAL */}
      {/* ========================================= */}

      <Modal
        isOpen={Boolean(downgradePlan)}
        onClose={() => {
          if (!downgradingPlan) {
            setDowngradePlan(null);
          }
        }}
        title="Schedule Downgrade"
        description="Review your plan change before scheduling it."
      >
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Current plan</p>

              <p className="mt-1 font-semibold capitalize text-gray-900">
                {subscription.planName}
              </p>
            </div>

            <span className="text-xl text-gray-400">→</span>

            <div className="text-right">
              <p className="text-sm text-gray-500">New plan</p>

              <p className="mt-1 font-semibold capitalize text-gray-900">
                {downgradePlan}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm leading-6 text-amber-800">
            Your current{" "}
            <span className="font-semibold capitalize">
              {subscription.planName}
            </span>{" "}
            plan will remain active until the end of your current billing
            period.
          </p>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            The{" "}
            <span className="font-semibold capitalize">{downgradePlan}</span>{" "}
            plan will become active when the current billing period ends.
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={() => setDowngradePlan(null)}
            disabled={downgradingPlan}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmDowngrade}
            disabled={downgradingPlan}
            className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            {downgradingPlan ? "Scheduling..." : "Confirm Downgrade"}
          </button>
        </div>
      </Modal>

      {/* ========================================= */}
      {/* CANCEL SUBSCRIPTION MODAL */}
      {/* ========================================= */}

      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          if (!canceling) {
            setShowCancelModal(false);
          }
        }}
        title="Cancel Subscription"
        description="Are you sure you want to cancel your subscription?"
      >
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm leading-6 text-red-700">
            Your{" "}
            <span className="font-semibold capitalize">
              {subscription.planName}
            </span>{" "}
            plan will remain active until the end of your current billing
            period.
          </p>

          <p className="mt-2 text-sm leading-6 text-red-700">
            After the billing period ends, your subscription will be canceled.
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={() => setShowCancelModal(false)}
            disabled={canceling}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            Keep Subscription
          </button>

          <button
            type="button"
            onClick={handleConfirmCancel}
            disabled={canceling}
            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            {canceling ? "Canceling..." : "Confirm Cancellation"}
          </button>
        </div>
      </Modal>

      {/* ========================================= */}
      {/* RESTORE SUBSCRIPTION MODAL */}
      {/* ========================================= */}

      <Modal
        isOpen={showRestoreModal}
        onClose={() => {
          if (!restoring) {
            setShowRestoreModal(false);
          }
        }}
        title="Restore Subscription"
        description="Do you want to keep your current subscription active?"
      >
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm leading-6 text-emerald-700">
            Your cancellation is currently scheduled.
          </p>

          <p className="mt-2 text-sm leading-6 text-emerald-700">
            Restoring your subscription will remove the scheduled cancellation
            and keep your{" "}
            <span className="font-semibold capitalize">
              {subscription.planName}
            </span>{" "}
            plan active.
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:gap-3">
          <button
            type="button"
            onClick={() => setShowRestoreModal(false)}
            disabled={restoring}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            Keep Cancellation
          </button>

          <button
            type="button"
            onClick={handleConfirmRestore}
            disabled={restoring}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            {restoring ? "Restoring..." : "Confirm Restore"}
          </button>
        </div>
      </Modal>
    </>
  );
};

export default SubscriptionCard;
