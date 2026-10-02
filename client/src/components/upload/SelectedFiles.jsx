const SelectedFiles = ({previews, files, onRemove, loading}) => {
  if (previews.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Selected Images
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            These images are ready to upload.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {files.length} image{files.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {previews.map((preview, index) => (
          <div
            key={`${preview.file.name}-${index}`}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-slate-100">
              <img
                src={preview.url}
                alt={preview.file.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => onRemove(index)}
                disabled={loading}
                aria-label={`Remove ${preview.file.name}`}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-lg text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* File Information */}
            <div className="p-3">
              <p
                className="truncate text-xs font-medium text-slate-700"
                title={preview.file.name}
              >
                {preview.file.name}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {(preview.file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectedFiles;
