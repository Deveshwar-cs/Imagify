const QualityPanel = ({onQuality, selectedImages, processing}) => {
  if (selectedImages.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <div>
        <p className="text-sm font-semibold text-indigo-600">
          Improve Image Quality
        </p>

        <h3 className="mt-1 text-lg font-semibold text-slate-900">
          Enhance your images
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Improve sharpness and overall image quality for your selected images.
        </p>
      </div>

      {/* Information */}
      <div className="mt-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
        <p className="text-sm text-indigo-700">
          The image quality will be enhanced automatically using the image
          processing engine.
        </p>
      </div>

      {/* Process Button */}
      <button
        type="button"
        onClick={() => onQuality(selectedImages)}
        disabled={processing}
        className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {processing ? "Processing..." : "Improve Image Quality"}
      </button>
    </div>
  );
};

export default QualityPanel;
