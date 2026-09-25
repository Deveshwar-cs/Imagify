const ProcessingOptions = ({
  selectedImages,
  selectedOperation,
  onSelectOperation,
  onClearError,
}) => {
  if (selectedImages.length === 0) {
    return null;
  }

  const handleOperationSelect = (operation) => {
    onSelectOperation(operation);
    onClearError();
  };

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-indigo-600">Selected Images</p>

      <h2 className="mt-1 text-xl font-semibold text-slate-900">
        {selectedImages.length} image
        {selectedImages.length !== 1 ? "s" : ""} selected
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Choose an operation to apply to all selected images.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Resize */}
        <button
          type="button"
          onClick={() => handleOperationSelect("resize")}
          className={`rounded-xl border p-5 text-left transition ${
            selectedOperation === "resize"
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50"
          }`}
        >
          <h3 className="font-semibold text-slate-900">Resize</h3>

          <p className="mt-1 text-sm text-slate-500">
            Change image width and height.
          </p>
        </button>

        {/* Compress */}
        <button
          type="button"
          onClick={() => handleOperationSelect("compress")}
          className={`rounded-xl border p-5 text-left transition ${
            selectedOperation === "compress"
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50"
          }`}
        >
          <h3 className="font-semibold text-slate-900">Compress</h3>

          <p className="mt-1 text-sm text-slate-500">
            Reduce the image file size.
          </p>
        </button>

        {/* Improve Quality */}
        <button
          type="button"
          onClick={() => handleOperationSelect("quality")}
          className={`rounded-xl border p-5 text-left transition ${
            selectedOperation === "quality"
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50"
          }`}
        >
          <h3 className="font-semibold text-slate-900">Improve Quality</h3>

          <p className="mt-1 text-sm text-slate-500">
            Enhance the image quality.
          </p>
        </button>

        {/* Upscale */}
        <button
          type="button"
          onClick={() => handleOperationSelect("upscale")}
          className={`rounded-xl border p-5 text-left transition ${
            selectedOperation === "upscale"
              ? "border-indigo-500 bg-indigo-50"
              : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50"
          }`}
        >
          <h3 className="font-semibold text-slate-900">Upscale</h3>

          <p className="mt-1 text-sm text-slate-500">
            Increase the image resolution.
          </p>
        </button>
      </div>
    </section>
  );
};

export default ProcessingOptions;
