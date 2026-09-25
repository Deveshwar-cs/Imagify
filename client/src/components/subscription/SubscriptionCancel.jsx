const SubscriptionCancel = () => {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <span className="text-2xl">×</span>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-900">
          Checkout cancelled
        </h1>

        <p className="mt-3 text-slate-500">
          Your subscription was not completed. You can return to the pricing
          page whenever you're ready.
        </p>

        <button
          onClick={() => {
            window.location.href = "/";
          }}
          className="mt-6 rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-slate-700"
        >
          Back to Imagify
        </button>
      </div>
    </section>
  );
};

export default SubscriptionCancel;
