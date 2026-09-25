const UploadedImages = ({
  uploadedImages,
  selectedImages,
  onToggleSelection,
  onSelectAll,
  onClearSelection,
}) => {
  return (
    <section className="mt-12">
      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
            Processing Workspace
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Uploaded Images
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select one or more images to process.
          </p>
        </div>

        {uploadedImages.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
              {uploadedImages.length} image
              {uploadedImages.length !== 1 ? "s" : ""}
            </span>

            <button
              type="button"
              onClick={onSelectAll}
              className="rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-100"
            >
              Select All
            </button>
          </div>
        )}
      </div>

      {/* Selection Information */}
      {selectedImages.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <p className="text-sm font-medium text-indigo-700">
            {selectedImages.length} image
            {selectedImages.length !== 1 ? "s" : ""} selected
          </p>

          <button
            type="button"
            onClick={onClearSelection}
            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-800"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Empty State */}
      {uploadedImages.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <svg
              className="h-8 w-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M4 16l4.586-4.586a2 2 0 016.828 0L20 16M14 14l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <h3 className="mt-5 text-lg font-semibold text-slate-900">
            No uploaded images
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Upload an image above to get started.
          </p>
        </div>
      ) : (
        /* Image Grid */
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {uploadedImages.map((image) => {
            const isSelected = selectedImages.includes(image.id);

            return (
              <div
                key={image.id}
                className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  isSelected
                    ? "border-indigo-500 ring-2 ring-indigo-100"
                    : "border-slate-200"
                }`}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={image.url}
                    alt={image.originalName}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                  {/* Ready Badge */}
                  <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-600 shadow-sm backdrop-blur">
                    Ready
                  </div>

                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute right-3 top-3 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      Selected
                    </div>
                  )}
                </div>

                {/* Information */}
                <div className="p-4">
                  <h3
                    className="truncate text-sm font-semibold text-slate-900"
                    title={image.originalName}
                  >
                    {image.originalName}
                  </h3>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {/* Dimensions */}
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Dimensions</p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {image.width} × {image.height}
                      </p>
                    </div>

                    {/* Size */}
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">Size</p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {(image.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>

                  {/* Select */}
                  <button
                    type="button"
                    onClick={() => onToggleSelection(image.id)}
                    className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                      isSelected
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {isSelected ? "Selected" : "Select Image"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default UploadedImages;
