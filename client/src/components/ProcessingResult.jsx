const ProcessingResult = ({result}) => {
  if (!result) {
    return null;
  }

  const formatSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Processing complete
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your resized image is ready.
            </p>
          </div>

          <a
            href={result.processed.url}
            download={result.processed.fileName}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Download
          </a>
        </div>
      </div>

      {/* Images */}
      <div className="grid md:grid-cols-2">
        {/* Original */}
        <div className="border-b border-slate-200 p-6 md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Original</h3>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              Before
            </span>
          </div>

          <div className="flex min-h-72 items-center justify-center rounded-2xl bg-slate-100 p-4">
            <img
              src={result.original.url}
              alt="Original"
              className="max-h-80 max-w-full rounded-xl object-contain"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Dimensions</p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {result.original.width} × {result.original.height}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">File size</p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatSize(result.original.size)}
              </p>
            </div>
          </div>
        </div>

        {/* Processed */}
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Processed</h3>

            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
              After
            </span>
          </div>

          <div className="flex min-h-72 items-center justify-center rounded-2xl bg-slate-100 p-4">
            <img
              src={result.processed.url}
              alt="Processed"
              className="max-h-80 max-w-full rounded-xl object-contain"
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Dimensions</p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {result.processed.width} × {result.processed.height}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">File size</p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatSize(result.processed.size)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingResult;
