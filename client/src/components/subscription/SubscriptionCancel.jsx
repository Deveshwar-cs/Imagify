import {useNavigate} from "react-router-dom";

const SubscriptionCancel = () => {
  const navigate = useNavigate();

  return (
    <section className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <span className="text-2xl text-slate-500">×</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Checkout cancelled
        </h1>

        <p className="mt-3 text-slate-500">
          Your subscription was not completed. No changes were made to your
          current membership.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate("/subscription")}
            className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-700"
          >
            Back to Subscription
          </button>

          <button
            onClick={() => navigate("/home")}
            className="rounded-xl border border-slate-200 px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Go to Home
          </button>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionCancel;
