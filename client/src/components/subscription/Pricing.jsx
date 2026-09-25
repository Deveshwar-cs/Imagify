import {useState} from "react";
import {createCheckoutSession} from "../../services/subscription.service";
const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$5",
    description: "For users who need basic image storage.",
    limit: 10,
  },
  {
    id: "premium",
    name: "Premium",
    price: "$10",
    description: "For users who need more image storage.",
    limit: 20,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$20",
    description: "For users who need higher storage limits.",
    limit: 30,
  },
];

const Pricing = () => {
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState("");

  const handleSubscribe = async (plan) => {
    try {
      setLoadingPlan(plan);
      setError("");

      const response = await createCheckoutSession(plan);

      const checkoutUrl = response.url;

      if (!checkoutUrl) {
        throw new Error("Stripe checkout URL was not returned");
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Subscription checkout error:", error);

      setError(error.response?.data?.message || "Unable to start checkout.");

      setLoadingPlan("");
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold text-slate-900">Choose your plan</h1>

        <p className="mt-3 text-slate-500">
          Store your images securely and get public image URLs with Imagify.
        </p>
      </div>

      {error && (
        <div className="mx-auto mt-6 max-w-2xl rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-slate-900">
              {plan.name}
            </h2>

            <p className="mt-2 text-sm text-slate-500">{plan.description}</p>

            <div className="mt-6">
              <span className="text-4xl font-bold text-slate-900">
                {plan.price}
              </span>

              <span className="text-sm text-slate-500">/month</span>
            </div>

            <div className="my-6 h-px bg-slate-100" />

            <p className="text-sm text-slate-600">
              Up to{" "}
              <span className="font-semibold text-slate-900">
                {plan.limit} images
              </span>
            </p>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loadingPlan === plan.id}
              className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingPlan === plan.id
                ? "Redirecting..."
                : `Choose ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Pricing;
