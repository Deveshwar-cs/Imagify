import {useEffect} from "react";
import {useNavigate} from "react-router-dom";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/subscription");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-2xl text-green-600">✓</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Subscription successful!
        </h1>

        <p className="mt-3 text-slate-500">
          Your payment was successful. We are activating your Imagify
          subscription.
        </p>

        <p className="mt-4 text-sm text-slate-400">
          Redirecting to your subscription page...
        </p>

        <button
          onClick={() => navigate("/subscription")}
          className="mt-6 rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-700"
        >
          View Subscription
        </button>
      </div>
    </section>
  );
};

export default SubscriptionSuccess;
