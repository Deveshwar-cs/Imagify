const ResizePanel = ({
  resizeOptions,
  setResizeOptions,
  onResize,
  selectedImages,
  processing,
}) => {
  if (selectedImages.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Resize Images</p>

        <h3 className="mt-1 text-lg font-semibold text-slate-900">
          Set dimensions
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Choose the width and height for your selected images.
        </p>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {/* Width */}
        <div>
          <label
            htmlFor="resize-width"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Width
          </label>

          <input
            id="resize-width"
            type="number"
            min="1"
            value={resizeOptions.width}
            onChange={(event) =>
              setResizeOptions((prev) => ({
                ...prev,
                width: event.target.value,
              }))
            }
            placeholder="Enter width"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Height */}
        <div>
          <label
            htmlFor="resize-height"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Height
          </label>

          <input
            id="resize-height"
            type="number"
            min="1"
            value={resizeOptions.height}
            onChange={(event) =>
              setResizeOptions((prev) => ({
                ...prev,
                height: event.target.value,
              }))
            }
            placeholder="Enter height"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Maintain Aspect Ratio */}
      <label className="mt-5 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={resizeOptions.maintainAspectRatio}
          onChange={(event) =>
            setResizeOptions((prev) => ({
              ...prev,
              maintainAspectRatio: event.target.checked,
            }))
          }
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />

        <span className="text-sm font-medium text-slate-700">
          Maintain aspect ratio
        </span>
      </label>

      {/* Process Button */}
      <button
        type="button"
        onClick={() => onResize(selectedImages)}
        disabled={processing || !resizeOptions.width || !resizeOptions.height}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {processing ? "Processing..." : "Resize Images"}
      </button>
    </div>
  );
};

export default ResizePanel;
