const UploadDropzone = ({onFileChange, error, children}) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Upload Area */}
      <label
        htmlFor="image-upload"
        className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center transition hover:border-slate-500 hover:bg-slate-100"
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
          <svg
            className="h-8 w-8 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M12 16V4m0 0L7 9m5-5 5 5M5 20h14"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-slate-900">
          Select your images
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Click here to choose PNG, JPG, JPEG or WEBP images
        </p>

        <input
          id="image-upload"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          onChange={onFileChange}
          className="hidden"
        />
      </label>

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Selected Files */}
      {children}
    </section>
  );
};

export default UploadDropzone;
