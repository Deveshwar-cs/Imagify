import {useEffect, useState} from "react";
import {uploadImages} from "../../services/image.service";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const ImageUploader = ({onUploaded, usage}) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [previews]);

  const processFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    setError("");
    setUploadedImages([]);

    const selectedFilesArray = Array.from(selectedFiles);

    // --------------------------------------------------
    // Check usage limit
    // --------------------------------------------------

    if (usage && selectedFilesArray.length > usage.remaining) {
      setError(
        `You can select only ${usage.remaining} more image${
          usage.remaining === 1 ? "" : "s"
        }.`,
      );

      return;
    }

    // --------------------------------------------------
    // Check file types
    // --------------------------------------------------

    const invalidType = selectedFilesArray.find(
      (file) => !allowedTypes.includes(file.type),
    );

    if (invalidType) {
      setError("Only JPG, PNG, and WEBP images are supported.");

      return;
    }

    // --------------------------------------------------
    // Check file size
    // --------------------------------------------------

    const oversizedFile = selectedFilesArray.find(
      (file) => file.size > MAX_FILE_SIZE,
    );

    if (oversizedFile) {
      setError("Each image must be less than 10 MB.");

      return;
    }

    // --------------------------------------------------
    // Cleanup previous previews
    // --------------------------------------------------

    previews.forEach((preview) => {
      URL.revokeObjectURL(preview);
    });

    // --------------------------------------------------
    // Create previews
    // --------------------------------------------------

    const previewUrls = selectedFilesArray.map((file) =>
      URL.createObjectURL(file),
    );

    setFiles(selectedFilesArray);
    setPreviews(previewUrls);
  };

  // --------------------------------------------------
  // File input
  // --------------------------------------------------

  const handleFileChange = (event) => {
    processFiles(event.target.files);

    // Allow selecting the same file again
    event.target.value = "";
  };

  // --------------------------------------------------
  // Drag and drop
  // --------------------------------------------------

  const handleDrop = (event) => {
    event.preventDefault();

    setIsDragging(false);

    processFiles(event.dataTransfer.files);
  };

  // --------------------------------------------------
  // Upload images
  // --------------------------------------------------

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one image.");

      return;
    }

    // Extra frontend usage check
    if (usage && files.length > usage.remaining) {
      setError(
        `You can upload only ${usage.remaining} more image${
          usage.remaining === 1 ? "" : "s"
        }.`,
      );

      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await uploadImages(formData);

      console.log("Upload response:", response);

      const images = response.images || [];

      setUploadedImages(images);

      onUploaded(images);
    } catch (error) {
      console.error("Upload error:", error);

      setError(
        error.response?.data?.message ||
          "Something went wrong while uploading the images.",
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Reset
  // --------------------------------------------------

  const reset = () => {
    previews.forEach((preview) => {
      URL.revokeObjectURL(preview);
    });

    setFiles([]);
    setPreviews([]);
    setUploadedImages([]);
    setError("");
  };

  const remainingImages = usage?.remaining ?? null;

  return (
    <div className="w-full">
      {/* --------------------------------------------- */}
      {/* Usage information */}
      {/* --------------------------------------------- */}

      {usage && (
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-medium text-slate-900">Image usage</p>

            <p className="mt-1 text-sm text-slate-500">
              {usage.used} of {usage.limit} images used
            </p>
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              {usage.remaining}
            </p>

            <p className="text-xs text-slate-500">remaining</p>
          </div>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* Usage limit reached */}
      {/* --------------------------------------------- */}

      {usage && remainingImages === 0 && (
        <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="font-medium text-amber-900">
            You have reached your image limit.
          </p>

          <p className="mt-1 text-sm text-amber-700">
            Please log in or upgrade your plan to continue processing images.
          </p>
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* Upload area */}
      {/* --------------------------------------------- */}

      {files.length === 0 && (!usage || remainingImages > 0) && (
        <label
          htmlFor="image-upload"
          onDragOver={(event) => {
            event.preventDefault();

            setIsDragging(true);
          }}
          onDragLeave={() => {
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`flex min-h-80 cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 transition ${
            isDragging
              ? "border-slate-900 bg-slate-100"
              : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
          }`}
        >
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            ↑
          </div>

          <h2 className="text-xl font-semibold text-slate-900">
            Drop your images here
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            or click to browse from your device
          </p>

          <div className="mt-6 flex gap-2 text-xs text-slate-400">
            <span>JPG</span>

            <span>•</span>

            <span>PNG</span>

            <span>•</span>

            <span>WEBP</span>

            <span>•</span>

            <span>Max 10 MB each</span>
          </div>

          <input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {/* --------------------------------------------- */}
      {/* Error */}
      {/* --------------------------------------------- */}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* --------------------------------------------- */}
      {/* Selected images */}
      {/* --------------------------------------------- */}

      {files.length > 0 && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Selected Images
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {files.length} image{files.length > 1 ? "s" : ""} selected
              </p>
            </div>

            <button
              type="button"
              onClick={reset}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remove All
            </button>
          </div>

          {/* Image grid */}
          <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
              >
                <div className="flex h-52 items-center justify-center bg-slate-100 p-4">
                  <img
                    src={previews[index]}
                    alt={file.name}
                    className="max-h-full max-w-full rounded-xl object-contain"
                  />
                </div>

                <div className="p-4">
                  <h3 className="truncate font-medium text-slate-900">
                    {file.name}
                  </h3>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Size</span>

                      <span className="font-medium text-slate-700">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-slate-500">Format</span>

                      <span className="font-medium uppercase text-slate-700">
                        {file.type.split("/")[1]}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Upload button */}
          <div className="border-t border-slate-200 p-6">
            <button
              type="button"
              onClick={handleUpload}
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Uploading..."
                : `Upload ${files.length} Image${files.length > 1 ? "s" : ""}`}
            </button>
          </div>

          {/* ----------------------------------------- */}
          {/* Uploaded images */}
          {/* ----------------------------------------- */}

          {uploadedImages.length > 0 && (
            <div className="border-t border-slate-200 p-6">
              <div className="rounded-2xl bg-green-50 p-5">
                {/* Success message */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">
                    ✓
                  </div>

                  <div>
                    <h3 className="font-semibold text-green-900">
                      Images uploaded successfully
                    </h3>

                    <p className="text-sm text-green-700">
                      {uploadedImages.length} image
                      {uploadedImages.length > 1 ? "s are" : " is"} ready to be
                      processed.
                    </p>
                  </div>
                </div>

                {/* Uploaded image grid */}
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {uploadedImages.map((image) => (
                    <div
                      key={image.id}
                      className="overflow-hidden rounded-xl bg-white"
                    >
                      <img
                        src={image.url}
                        alt={image.originalName}
                        className="h-48 w-full bg-slate-100 object-contain"
                      />

                      <div className="p-4">
                        <p className="truncate font-medium text-slate-900">
                          {image.originalName}
                        </p>

                        <div className="mt-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Dimensions</span>

                            <span className="font-medium">
                              {image.width} × {image.height}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-500">Size</span>

                            <span className="font-medium">
                              {(image.size / 1024).toFixed(2)} KB
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-slate-500">Format</span>

                            <span className="font-medium uppercase">
                              {image.mimeType.split("/")[1]}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
