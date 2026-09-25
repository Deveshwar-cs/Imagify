import {useEffect, useState} from "react";

import {Link} from "react-router-dom";

import {
  uploadImages,
  startImageProcessing,
  getBatchStatus,
} from "../services/image.service";

import {createShare} from "../services/share.service";

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);

  // Batch processing
  const [batchId, setBatchId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [progress, setProgress] = useState(0);

  const [compressOptions, setCompressOptions] = useState({
    level: "medium",
  });

  const [upscaleOptions, setUpscaleOptions] = useState({
    scale: 2,
  });

  // Multiple selected images
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState(null);

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [processingError, setProcessingError] = useState("");

  // Share
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [copied, setCopied] = useState(false);

  const [resizeOptions, setResizeOptions] = useState({
    width: "",
    height: "",
    maintainAspectRatio: true,
  });

  // ============================================================
  // Format file size
  // ============================================================

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 Bytes";
    }

    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
  };

  // ============================================================
  // SHARE COMPLETED BATCH
  // ============================================================

  const handleShare = async () => {
    if (!batchId || batchStatus?.status !== "completed") {
      setShareError("Images must be completely processed before sharing.");
      return;
    }

    try {
      setShareLoading(true);
      setShareError("");
      setCopied(false);
      setShareUrl("");

      console.log("Creating share link for batch:", batchId);

      const response = await createShare(batchId);

      console.log("Create share response:", response);

      if (!response.success) {
        setShareError(response.message || "Failed to create share link.");
        return;
      }

      const generatedShareUrl = response.share?.url;

      if (!generatedShareUrl) {
        setShareError("Share link was not returned by the server.");
        return;
      }

      // Store the temporary URL.
      // Do NOT automatically copy it.
      setShareUrl(generatedShareUrl);

      console.log("Temporary share URL:", generatedShareUrl);
    } catch (error) {
      console.error("Failed to create share link:", error);

      setShareError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create share link.",
      );
    } finally {
      setShareLoading(false);
    }
  };

  // ============================================================
  // COPY SHARE URL
  // ============================================================

  const handleCopyShareUrl = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy share URL:", error);

      setShareError("Failed to copy the share link.");
    }
  };

  // ============================================================
  // Handle processing errors
  // ============================================================

  const handleProcessingError = (error, fallbackMessage) => {
    console.error("PROCESSING ERROR:", error);
    console.log("STATUS:", error.response?.status);
    console.log("DATA:", error.response?.data);

    const message =
      error.response?.data?.message || error.message || fallbackMessage;

    setProcessing(false);
    setProcessingError(message);
  };

  // ============================================================
  // Cleanup preview URLs
  // ============================================================

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [previews]);

  // ============================================================
  // Poll batch status
  // ============================================================

  useEffect(() => {
    if (!batchId) {
      return;
    }

    let intervalId;

    const checkBatchStatus = async () => {
      try {
        const response = await getBatchStatus(batchId);

        console.log("Batch status response:", response);

        if (!response.success) {
          setError(response.message || "Failed to get batch status.");
          return;
        }

        const batch = response.batch;

        setBatchStatus(batch);
        setProgress(batch.progress);

        console.log("Batch status:", batch);

        // Stop polling when processing finishes
        if (batch.status === "completed" || batch.status === "failed") {
          clearInterval(intervalId);
          setProcessing(false);
        }
      } catch (error) {
        console.error("Failed to get batch status:", error);

        setError(
          error.response?.data?.message ||
            error.message ||
            "Failed to get processing status.",
        );

        clearInterval(intervalId);
        setProcessing(false);
      }
    };

    // Check immediately
    checkBatchStatus();

    // Check every 2 seconds
    intervalId = setInterval(checkBatchStatus, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [batchId]);

  // ============================================================
  // Select files
  // ============================================================

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    setError("");
    setProcessingError("");

    const newPreviews = selectedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setFiles(selectedFiles);
    setPreviews(newPreviews);

    // Allow selecting the same file again
    event.target.value = "";
  };

  // ============================================================
  // Remove selected file before upload
  // ============================================================

  const removeFile = (index) => {
    if (previews[index]) {
      URL.revokeObjectURL(previews[index].url);
    }

    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);

    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
  };

  // ============================================================
  // Upload images
  // ============================================================

  const handleUpload = async () => {
    if (!files.length) {
      setError("Please select at least one image.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setProcessingError("");

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await uploadImages(formData);

      console.log("Upload response:", response);

      if (!response.success) {
        setError(response.message || "Upload failed.");
        return;
      }

      // Add newly uploaded images
      setUploadedImages((previousImages) => [
        ...previousImages,
        ...(response.images || []),
      ]);

      // Cleanup preview URLs
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });

      setFiles([]);
      setPreviews([]);
    } catch (error) {
      console.error("Image upload failed:", error);

      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload images.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Select / deselect an uploaded image
  // ============================================================

  const toggleImageSelection = (image) => {
    setSelectedImages((current) => {
      const alreadySelected = current.some(
        (selectedImage) => selectedImage.id === image.id,
      );

      if (alreadySelected) {
        return current.filter((selectedImage) => selectedImage.id !== image.id);
      }

      return [...current, image];
    });

    setError("");
    setProcessingError("");
  };

  // ============================================================
  // Select all uploaded images
  // ============================================================

  const handleSelectAll = () => {
    setSelectedImages(uploadedImages);
    setError("");
    setProcessingError("");
  };

  // ============================================================
  // Clear selected images
  // ============================================================

  const handleClearSelection = () => {
    setSelectedImages([]);
    setSelectedOperation(null);
    setError("");
    setProcessingError("");
  };

  // ============================================================
  // Start resize processing
  // ============================================================

  const handleResize = async () => {
    if (selectedImages.length === 0) {
      setError("Please select at least one image.");
      return;
    }

    if (!resizeOptions.width || !resizeOptions.height) {
      setError("Please enter width and height.");
      return;
    }

    const width = Number(resizeOptions.width);
    const height = Number(resizeOptions.height);

    if (!Number.isInteger(width) || width <= 0) {
      setError("Width must be a positive number.");
      return;
    }

    if (!Number.isInteger(height) || height <= 0) {
      setError("Height must be a positive number.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setProcessingError("");

      const response = await startImageProcessing({
        imageIds: selectedImages.map((image) => image.id),
        operation: "resize",
        options: {
          width,
          height,
          maintainAspectRatio: resizeOptions.maintainAspectRatio,
        },
      });

      console.log("Resize processing started:", response);

      if (!response.success) {
        setError(response.message || "Failed to start image processing.");

        setProcessing(false);
        return;
      }

      console.log("Resize batch ID:", response.batchId);

      setBatchId(response.batchId);
      setBatchStatus(null);
      setProgress(0);
      setSelectedOperation(null);

      // Clear previous share link
      setShareUrl("");
      setShareError("");
      setCopied(false);
    } catch (error) {
      handleProcessingError(error, "Failed to start image processing.");
    }
  };

  // ============================================================
  // Start compress processing
  // ============================================================

  const handleCompress = async () => {
    if (selectedImages.length === 0) {
      setError("Please select at least one image.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setProcessingError("");

      const response = await startImageProcessing({
        imageIds: selectedImages.map((image) => image.id),
        operation: "compress",
        options: {
          level: compressOptions.level,
        },
      });

      console.log("Compression processing started:", response);

      if (!response.success) {
        setError(response.message || "Failed to start compression.");

        setProcessing(false);
        return;
      }

      console.log("Compression batch ID:", response.batchId);

      setBatchId(response.batchId);
      setBatchStatus(null);
      setProgress(0);
      setSelectedOperation(null);

      setShareUrl("");
      setShareError("");
      setCopied(false);
    } catch (error) {
      handleProcessingError(error, "Failed to start compression.");
    }
  };

  // ============================================================
  // Start quality processing
  // ============================================================

  const handleQuality = async () => {
    if (selectedImages.length === 0) {
      setError("Please select at least one image.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setProcessingError("");

      const response = await startImageProcessing({
        imageIds: selectedImages.map((image) => image.id),
        operation: "quality",
        options: {},
      });

      console.log("Quality processing started:", response);

      if (!response.success) {
        setError(response.message || "Failed to start quality improvement.");

        setProcessing(false);
        return;
      }

      console.log("Quality batch ID:", response.batchId);

      setBatchId(response.batchId);
      setBatchStatus(null);
      setProgress(0);
      setSelectedOperation(null);

      setShareUrl("");
      setShareError("");
      setCopied(false);
    } catch (error) {
      handleProcessingError(error, "Failed to start quality improvement.");
    }
  };

  // ============================================================
  // Start upscale processing
  // ============================================================

  const handleUpscale = async () => {
    if (selectedImages.length === 0) {
      setError("Please select at least one image.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setProcessingError("");

      const response = await startImageProcessing({
        imageIds: selectedImages.map((image) => image.id),
        operation: "upscale",
        options: {
          scale: Number(upscaleOptions.scale),
        },
      });

      console.log("Upscale processing started:", response);

      if (!response.success) {
        setError(response.message || "Failed to start image upscaling.");

        setProcessing(false);
        return;
      }

      console.log("Upscale batch ID:", response.batchId);

      setBatchId(response.batchId);
      setBatchStatus(null);
      setProgress(0);
      setSelectedOperation(null);

      setShareUrl("");
      setShareError("");
      setCopied(false);
    } catch (error) {
      handleProcessingError(error, "Failed to start image upscaling.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ============================================================
          HEADER
      ============================================================ */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            to="/home"
            className="text-2xl font-bold tracking-tight text-slate-900"
          >
            Imagify
          </Link>

          <nav className="flex items-center gap-7">
            <Link
              to="/home"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              Home
            </Link>

            <Link to="/upload" className="text-sm font-semibold text-slate-900">
              Upload
            </Link>
          </nav>
        </div>
      </header>

      {/* ============================================================
          MAIN
      ============================================================ */}

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Page Heading */}

        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Image Workspace
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Upload your images
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Upload your images to Imagify and prepare them for resizing,
            compression, quality enhancement, and upscaling.
          </p>
        </div>

        {/* ============================================================
            UPLOAD CARD
        ============================================================ */}

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
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Error */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* ============================================================
              SELECTED FILES
          ============================================================ */}

          {previews.length > 0 && (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Selected Images
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    These images are ready to upload.
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {files.length} image
                  {files.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {previews.map((preview, index) => (
                  <div
                    key={`${preview.file.name}-${index}`}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={preview.url}
                        alt={preview.file.name}
                        className="h-full w-full object-cover"
                      />

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-lg text-slate-600 shadow-sm transition hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove ${preview.file.name}`}
                      >
                        ×
                      </button>
                    </div>

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

              <button
                type="button"
                onClick={handleUpload}
                disabled={loading}
                className="mt-8 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Uploading..." : "Upload Images"}
              </button>
            </div>
          )}
        </section>

        {/* ============================================================
            UPLOADED IMAGES
        ============================================================ */}

        <section className="mt-12">
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
                  onClick={handleSelectAll}
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
                onClick={handleClearSelection}
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
                const isSelected = selectedImages.some(
                  (selectedImage) => selectedImage.id === image.id,
                );

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
                        onClick={() => toggleImageSelection(image)}
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

        {/* ============================================================
            PROCESSING OPTIONS
        ============================================================ */}

        {selectedImages.length > 0 && (
          <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-indigo-600">
              Selected Images
            </p>

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
                onClick={() => {
                  setSelectedOperation("resize");
                  setError("");
                  setProcessingError("");
                }}
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
                onClick={() => {
                  setSelectedOperation("compress");
                  setError("");
                  setProcessingError("");
                }}
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
                onClick={() => {
                  setSelectedOperation("quality");
                  setError("");
                  setProcessingError("");
                }}
                className={`rounded-xl border p-5 text-left transition ${
                  selectedOperation === "quality"
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50"
                }`}
              >
                <h3 className="font-semibold text-slate-900">
                  Improve Quality
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Enhance the image quality.
                </p>
              </button>

              {/* Upscale */}

              <button
                type="button"
                onClick={() => {
                  setSelectedOperation("upscale");
                  setError("");
                  setProcessingError("");
                }}
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
        )}

        {/* ============================================================
            RESIZE PANEL
        ============================================================ */}

        {selectedImages.length > 0 && selectedOperation === "resize" && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                Resize
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Configure image dimensions
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Set the width and height for all selected images.
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
                    setResizeOptions((previous) => ({
                      ...previous,
                      width: event.target.value,
                    }))
                  }
                  placeholder={`Current: ${selectedImages[0]?.width}px`}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                    setResizeOptions((previous) => ({
                      ...previous,
                      height: event.target.value,
                    }))
                  }
                  placeholder={`Current: ${selectedImages[0]?.height}px`}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Maintain Aspect Ratio */}

            <label className="mt-5 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={resizeOptions.maintainAspectRatio}
                onChange={(event) =>
                  setResizeOptions((previous) => ({
                    ...previous,
                    maintainAspectRatio: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300"
              />

              <span className="text-sm font-medium text-slate-700">
                Maintain aspect ratio
              </span>
            </label>

            {/* Resize Button */}

            <button
              type="button"
              onClick={handleResize}
              disabled={processing}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing
                ? "Adding to processing queue..."
                : `Resize ${selectedImages.length} Image${
                    selectedImages.length !== 1 ? "s" : ""
                  }`}
            </button>
          </section>
        )}

        {/* ============================================================
            COMPRESS PANEL
        ============================================================ */}

        {selectedImages.length > 0 && selectedOperation === "compress" && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                Compress
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Configure compression
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Choose how strongly you want to compress the selected images.
              </p>
            </div>

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
                  setCompressOptions({
                    level: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="low">Low Compression</option>

                <option value="medium">Medium Compression</option>

                <option value="high">High Compression</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleCompress}
              disabled={processing}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing
                ? "Adding to processing queue..."
                : `Compress ${selectedImages.length} Image${
                    selectedImages.length !== 1 ? "s" : ""
                  }`}
            </button>
          </section>
        )}

        {/* ============================================================
            QUALITY PANEL
        ============================================================ */}

        {selectedImages.length > 0 && selectedOperation === "quality" && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
              Improve Quality
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Improve image quality
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Improve the quality of all selected images.
            </p>

            <button
              type="button"
              onClick={handleQuality}
              disabled={processing}
              className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing
                ? "Adding to processing queue..."
                : `Improve ${selectedImages.length} Image${
                    selectedImages.length !== 1 ? "s" : ""
                  }`}
            </button>
          </section>
        )}

        {/* ============================================================
            UPSCALE PANEL
        ============================================================ */}

        {selectedImages.length > 0 && selectedOperation === "upscale" && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
              Upscale Images
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Choose how much you want to increase the resolution of the
              selected images.
            </p>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Upscale Factor
              </label>

              <select
                value={upscaleOptions.scale}
                onChange={(event) =>
                  setUpscaleOptions({
                    ...upscaleOptions,
                    scale: Number(event.target.value),
                  })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value={2}>2×</option>
                <option value={3}>3×</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleUpscale}
              disabled={processing}
              className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing
                ? "Adding to processing queue..."
                : `Upscale ${selectedImages.length} Image${
                    selectedImages.length !== 1 ? "s" : ""
                  }`}
            </button>
          </section>
        )}

        {/* ============================================================
            PROCESSING ERROR
        ============================================================ */}

        {processingError && (
          <div className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-red-700">
            <div>
              <p className="font-semibold">Processing failed</p>

              <p className="mt-1 text-sm">{processingError}</p>
            </div>

            <button
              type="button"
              onClick={() => setProcessingError("")}
              className="text-xl text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* ============================================================
            PROCESSING PROGRESS
        ============================================================ */}

        {batchId && batchStatus && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Processing Images
                </h2>

                <p className="text-sm text-slate-500">
                  {batchStatus.completedImages} of {batchStatus.totalImages}{" "}
                  images completed
                </p>
              </div>

              <span className="text-lg font-bold text-slate-900">
                {progress}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm font-medium capitalize text-slate-600">
                Status: {batchStatus.status}
              </p>

              {batchStatus.failedImages > 0 && (
                <p className="text-sm text-red-600">
                  {batchStatus.failedImages} image
                  {batchStatus.failedImages > 1 ? "s" : ""} failed.
                </p>
              )}
            </div>

            {batchStatus.status === "completed" && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                Processing completed successfully.
              </div>
            )}

            {batchStatus.status === "failed" && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Processing finished with failed images.
              </div>
            )}
          </section>
        )}

        {/* ============================================================
            PROCESSED IMAGES
        ============================================================ */}

        {batchStatus?.status === "completed" && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Results Header */}

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Processed Images
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your processed images are ready to download and share.
                </p>
              </div>

              {/* ========================================================
                  SHARE WHOLE BATCH
              ======================================================== */}

              <button
                type="button"
                onClick={handleShare}
                disabled={shareLoading}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {shareLoading ? "Creating share link..." : "Share Results"}
              </button>
            </div>

            {/* ========================================================
                SHARE ERROR
            ======================================================== */}

            {shareError && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {shareError}
              </div>
            )}

            {/* ========================================================
                SHARE URL
            ======================================================== */}

            {shareUrl && (
              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Share your results
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Anyone with this temporary link can view your processed
                    images.
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleCopyShareUrl}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  This link will expire after 1 hour.
                </p>
              </div>
            )}

            {/* ========================================================
                IMAGES
            ======================================================== */}

            <div className="grid gap-6 md:grid-cols-2">
              {batchStatus.images.map((image) => {
                const processedImages = image.processedImages || [];

                const processedImage =
                  processedImages[processedImages.length - 1];

                if (!processedImage) {
                  return null;
                }

                return (
                  <div
                    key={image._id || image.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                  >
                    <div className="grid grid-cols-2 gap-3 p-4">
                      {/* Original */}

                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">
                          Original
                        </p>

                        <div className="overflow-hidden rounded-xl bg-white">
                          <img
                            src={image.url}
                            alt={image.originalName}
                            className="h-48 w-full object-contain"
                          />
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          <p>Size: {formatFileSize(image.size)}</p>

                          <p>
                            Dimensions: {image.width} × {image.height}
                          </p>
                        </div>
                      </div>

                      {/* Processed */}

                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">
                          Processed
                        </p>

                        <div className="overflow-hidden rounded-xl bg-white">
                          <img
                            src={processedImage.url}
                            alt={`Processed ${image.originalName}`}
                            className="h-48 w-full object-contain"
                          />
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-slate-500">
                          <p>Size: {formatFileSize(processedImage.size)}</p>

                          <p>
                            Dimensions: {processedImage.width} ×{" "}
                            {processedImage.height}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 bg-white p-4">
                      <a
                        href={processedImage.url}
                        download={processedImage.fileName}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* ============================================================
          FOOTER
      ============================================================ */}

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Imagify. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Upload;
