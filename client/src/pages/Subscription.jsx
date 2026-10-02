import {useState} from "react";
import {Link} from "react-router-dom";

import {createCheckoutSession} from "../services/subscription.service";

import SubscriptionCard from "../components/subscription/SubscriptionCard";

import Footer from "../components/layout/Footer";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "₹99",
    description: "For users who need basic image storage.",
    limit: 10,
  },
  {
    id: "premium",
    name: "Premium",
    price: "₹199",
    description: "For users who need more image storage.",
    limit: 20,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "₹299",
    description: "For users who need higher image storage limits.",
    limit: 30,
  },
];

const Subscription = () => {
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [subscription, setSubscription] = useState(null);

  const handleSubscriptionLoaded = (currentSubscription) => {
    setSubscription(currentSubscription);
  };

  const handleSubscribe = async (plan) => {
    try {
      setLoadingPlan(plan);
      setError("");

      const response = await createCheckoutSession(plan);

      const checkoutUrl = response.url;

      if (!checkoutUrl) {
        throw new Error("Stripe checkout URL was not returned.");
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Subscription checkout error:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to start checkout.",
      );

      setLoadingPlan("");
    }
  };

  const handleSubscriptionUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <>
      {/* Subscription Navbar */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/home" className="text-xl font-bold text-slate-900">
            Imagify
          </Link>

          <Link
            to="/home"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          {/* Page Header */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Imagify Membership
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
              Manage your subscription
            </h1>

            <p className="mt-3 text-slate-500">
              Manage your current membership, change your plan, or choose a new
              storage plan for your Imagify account.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Current Subscription */}
          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Current membership
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View and manage your active subscription.
              </p>
            </div>

            <SubscriptionCard
              key={refreshKey}
              onSubscriptionUpdated={handleSubscriptionUpdated}
              onSubscriptionLoaded={handleSubscriptionLoaded}
            />
          </section>

          {/* Available Plans */}
          <section className="mt-12">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">
                Available plans
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Choose the storage capacity that fits your needs.
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {plans.map((plan) => {
                const hasActiveSubscription = subscription?.status === "active";

                const isCurrentPlan =
                  hasActiveSubscription && subscription?.plan === plan.id;

                return (
                  <div
                    key={plan.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    {/* Plan Name */}
                    <h3 className="text-xl font-semibold text-slate-900">
                      {plan.name}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 min-h-10 text-sm text-slate-500">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mt-6 flex items-end gap-1">
                      <span className="text-4xl font-bold text-slate-900">
                        {plan.price}
                      </span>

                      <span className="mb-1 text-sm text-slate-500">
                        /month
                      </span>
                    </div>

                    <div className="my-6 h-px bg-slate-100" />

                    {/* Storage */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        Image storage
                      </span>

                      <span className="font-semibold text-slate-900">
                        {plan.limit} images
                      </span>
                    </div>

                    {/* Features */}
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-green-600">✓</span>
                        Secure image storage
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-green-600">✓</span>
                        Public image URLs
                      </div>

                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="text-green-600">✓</span>
                        Image management
                      </div>
                    </div>

                    {/* Checkout */}
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={
                        hasActiveSubscription || loadingPlan === plan.id
                      }
                      className={`mt-7 w-full rounded-xl px-5 py-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        hasActiveSubscription
                          ? "border border-slate-200 bg-slate-100 text-slate-500"
                          : "bg-slate-900 text-white hover:bg-slate-700"
                      }`}
                    >
                      {hasActiveSubscription
                        ? isCurrentPlan
                          ? "Current Plan"
                          : "Manage Above"
                        : loadingPlan === plan.id
                          ? "Redirecting..."
                          : `Choose ${plan.name}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bottom Information */}
          <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">
              Need to change your plan?
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
              Upgrades are handled immediately through Stripe. Downgrades can be
              scheduled for the end of your current billing period.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Subscription;
