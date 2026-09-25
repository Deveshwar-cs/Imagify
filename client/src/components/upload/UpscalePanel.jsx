const UpscalePanel = ({
  upscaleOptions,
  setUpscaleOptions,
  onUpscale,
  selectedImages,
  processing,
}) => {
  if (selectedImages.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Upscale Images</p>

        <h3 className="mt-1 text-lg font-semibold text-slate-900">
          Increase image resolution
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Choose how much you want to increase the image resolution.
        </p>
      </div>

      {/* Upscale Scale */}
      <div className="mt-6">
        <label
          htmlFor="upscale-scale"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Upscale Scale
        </label>

        <select
          id="upscale-scale"
          value={upscaleOptions.scale}
          onChange={(event) =>
            setUpscaleOptions((prev) => ({
              ...prev,
              scale: Number(event.target.value),
            }))
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value={2}>2×</option>
          <option value={3}>3×</option>
        </select>
      </div>

      {/* Process Button */}
      <button
        type="button"
        onClick={() => onUpscale(selectedImages)}
        disabled={processing}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {processing ? "Processing..." : "Upscale Images"}
      </button>
    </div>
  );
};

export default UpscalePanel;
