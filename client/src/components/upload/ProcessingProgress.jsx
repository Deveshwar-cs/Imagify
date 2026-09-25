const ProcessingProgress = ({processing, progress, batchStatus}) => {
  if (!processing && !batchStatus) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Processing</p>

          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            Processing your images
          </h3>
        </div>

        <span className="text-sm font-semibold text-slate-600">
          {progress}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
          style={{
            width: `${Math.min(Math.max(progress, 0), 100)}%`,
          }}
        />
      </div>

      {/* Batch Information */}
      {batchStatus && (
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-400">Total</p>

            <p className="mt-1 text-sm font-semibold text-slate-700">
              {batchStatus.totalImages || 0}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-400">Completed</p>

            <p className="mt-1 text-sm font-semibold text-emerald-600">
              {batchStatus.completedImages || 0}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xs text-slate-400">Failed</p>

            <p className="mt-1 text-sm font-semibold text-red-600">
              {batchStatus.failedImages || 0}
            </p>
          </div>
        </div>
      )}

      {/* Status */}
      {batchStatus?.status && (
        <p className="mt-4 text-center text-sm text-slate-500">
          Status:{" "}
          <span className="font-medium capitalize text-slate-700">
            {batchStatus.status}
          </span>
        </p>
      )}
    </div>
  );
};

export default ProcessingProgress;
