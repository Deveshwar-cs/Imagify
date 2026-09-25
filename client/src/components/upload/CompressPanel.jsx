const CompressPanel = ({
  compressOptions,
  setCompressOptions,
  onCompress,
  selectedImages,
  processing,
}) => {
  if (selectedImages.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600">Compress Images</p>

        <h3 className="mt-1 text-lg font-semibold text-slate-900">
          Choose compression level
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Reduce the file size while keeping a good balance between quality and
          size.
        </p>
      </div>

      {/* Compression Level */}
      <div className="mt-6">
        <label
          htmlFor="compression-level"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Compression Level
        </label>

        <select
          id="compression-level"
          value={compressOptions.level}
          onChange={(event) =>
            setCompressOptions((prev) => ({
              ...prev,
              level: event.target.value,
            }))
          }
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="low">Low - Better Quality</option>
          <option value="medium">Medium - Balanced</option>
          <option value="high">High - Smaller Size</option>
        </select>
      </div>

      {/* Process Button */}
      <button
        type="button"
        onClick={() => onCompress(selectedImages)}
        disabled={processing}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {processing ? "Processing..." : "Compress Images"}
      </button>
    </div>
  );
};

export default CompressPanel;
