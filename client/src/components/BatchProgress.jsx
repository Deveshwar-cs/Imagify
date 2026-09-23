import {useEffect, useState} from "react";

import api from "../services/api";

const BatchProgress = ({batchId, onStatusChange}) => {
  console.log("BatchProgress received batchId:", batchId);

  const [batch, setBatch] = useState(null);
  const [error, setError] = useState("");

  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [copied, setCopied] = useState(false);

  // ============================================
  // SHARE RESULTS
  // ============================================

  const handleShare = async () => {
    try {
      setShareLoading(true);
      setShareError("");
      setCopied(false);

      const response = await api.post("/images/share", {
        batchId,
      });

      setShareUrl(response.data.share.url);
    } catch (error) {
      console.error("Failed to create share link:", error);

      setShareError(
        error.response?.data?.message || "Failed to create share link.",
      );
    } finally {
      setShareLoading(false);
    }
  };

  // ============================================
  // COPY SHARE URL
  // ============================================

  const handleCopyShareUrl = async () => {
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

  // ============================================
  // FETCH BATCH STATUS
  // ============================================

  useEffect(() => {
    if (!batchId) {
      return;
    }

    let intervalId;

    const fetchBatchStatus = async () => {
      try {
        const response = await api.get(`/images/batches/${batchId}`);

        const batchData = response.data.batch;

        console.log("Batch API response:", batchData);

        setBatch(batchData);
        setError("");

        // --------------------------------------------
        // Send status to parent App.jsx
        // --------------------------------------------

        if (onStatusChange) {
          onStatusChange(batchData.status);
        }

        // --------------------------------------------
        // Stop polling when processing is finished
        // --------------------------------------------

        if (batchData.status === "completed" || batchData.status === "failed") {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Failed to fetch batch status:", error);

        setError(
          error.response?.data?.message || "Failed to get processing status.",
        );
      }
    };

    // Fetch immediately
    fetchBatchStatus();

    // Poll every 2 seconds
    intervalId = setInterval(fetchBatchStatus, 2000);

    // Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, [batchId, onStatusChange]);

  // ============================================
  // LOADING
  // ============================================

  if (!batch && !error) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Checking processing status...</p>
      </div>
    );
  }

  // ============================================
  // ERROR
  // ============================================

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  // ============================================
  // BATCH DATA
  // ============================================

  const progress = batch.progress || 0;

  const isCompleted = batch.status === "completed";
  const isFailed = batch.status === "failed";
  const isProcessing =
    batch.status === "processing" || batch.status === "pending";

  return (
    <div className="space-y-6">
      {/* ============================================
          PROGRESS CARD
      ============================================ */}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Header */}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {isCompleted
                ? "Processing complete"
                : isFailed
                  ? "Processing failed"
                  : "Processing your images"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isCompleted
                ? "All images have finished processing."
                : isFailed
                  ? "Processing finished with some errors."
                  : `${batch.completedImages} of ${batch.totalImages} images completed`}
            </p>
          </div>

          {/* Percentage */}

          <span
            className={`text-sm font-semibold ${
              isCompleted
                ? "text-emerald-600"
                : isFailed
                  ? "text-red-600"
                  : "text-slate-700"
            }`}
          >
            {progress}%
          </span>
        </div>

        {/* ============================================
            PROGRESS BAR
        ============================================ */}

        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCompleted
                ? "bg-emerald-500"
                : isFailed
                  ? "bg-red-500"
                  : "bg-slate-900"
            }`}
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        {/* ============================================
            OPERATION + COUNT
        ============================================ */}

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="capitalize text-slate-500">{batch.operation}</span>

          <span className="font-medium text-slate-700">
            {batch.completedImages} / {batch.totalImages}
          </span>
        </div>

        {/* ============================================
            FAILED IMAGES
        ============================================ */}

        {batch.failedImages > 0 && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {batch.failedImages} image
            {batch.failedImages > 1 ? "s" : ""} failed to process.
          </div>
        )}

        {/* ============================================
            COMPLETED MESSAGE
        ============================================ */}

        {isCompleted && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                ✓
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-700">
                  Processing completed
                </p>

                <p className="mt-1 text-xs text-emerald-600">
                  Your processed images are ready.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            FAILED MESSAGE
        ============================================ */}

        {isFailed && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
                !
              </div>

              <div>
                <p className="text-sm font-semibold text-red-700">
                  Processing failed
                </p>

                <p className="mt-1 text-xs text-red-600">
                  Some images could not be processed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================
          COMPLETED RESULTS
      ============================================ */}

      {isCompleted && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Results Header */}

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Your images are ready
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Compare your original and processed images before downloading.
            </p>
          </div>

          {/* ============================================
              SHARE SECTION
          ============================================ */}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div>
              <h3 className="font-semibold text-slate-900">
                Share your results
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Generate a temporary link that anyone can use to view these
                results.
              </p>
            </div>

            {/* Share Button */}

            <button
              onClick={handleShare}
              disabled={shareLoading}
              className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {shareLoading ? "Creating share link..." : "Share Results"}
            </button>

            {/* Share Error */}

            {shareError && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {shareError}
              </p>
            )}

            {/* Share URL */}

            {shareUrl && (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-medium text-slate-700">Share link</p>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 outline-none"
                  />

                  <button
                    onClick={handleCopyShareUrl}
                    className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                  This link will expire after 1 hour.
                </p>
              </div>
            )}
          </div>

          {/* ============================================
              IMAGES
          ============================================ */}

          {batch.images?.length > 0 ? (
            <div className="mt-6 space-y-8">
              {batch.images.map((image) => {
                const processedImages = image.processedImages || [];

                const processedImage =
                  processedImages[processedImages.length - 1];

                if (!processedImage) {
                  return null;
                }

                return (
                  <div
                    key={image._id}
                    className="overflow-hidden rounded-3xl border border-slate-200"
                  >
                    {/* ====================================
                        IMAGE COMPARISON
                    ==================================== */}

                    <div className="grid md:grid-cols-2">
                      {/* ==================================
                          ORIGINAL IMAGE
                      ================================== */}

                      <div className="border-b border-slate-200 md:border-b-0 md:border-r">
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                          <h3 className="font-semibold text-slate-900">
                            Original Image
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            Before processing
                          </p>
                        </div>

                        {/* Original Preview */}

                        <div className="flex aspect-square items-center justify-center bg-slate-100 p-5">
                          <img
                            src={image.url}
                            alt={`Original ${image.originalName}`}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        {/* Original Details */}

                        <div className="p-5">
                          <h4
                            className="truncate font-medium text-slate-900"
                            title={image.originalName}
                          >
                            {image.originalName}
                          </h4>

                          <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Dimensions</span>

                              <span className="font-medium text-slate-700">
                                {image.width} × {image.height}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">File size</span>

                              <span className="font-medium text-slate-700">
                                {(image.size / 1024).toFixed(2)} KB
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Format</span>

                              <span className="font-medium text-slate-700">
                                {image.mimeType}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ==================================
                          PROCESSED IMAGE
                      ================================== */}

                      <div>
                        <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
                          <h3 className="font-semibold text-slate-900">
                            Processed Image
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            After {batch.operation}
                          </p>
                        </div>

                        {/* Processed Preview */}

                        <div className="flex aspect-square items-center justify-center bg-slate-100 p-5">
                          <img
                            src={processedImage.url}
                            alt={`Processed ${image.originalName}`}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        {/* Processed Details */}

                        <div className="p-5">
                          <h4
                            className="truncate font-medium text-slate-900"
                            title={image.originalName}
                          >
                            {image.originalName}
                          </h4>

                          <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Dimensions</span>

                              <span className="font-medium text-slate-700">
                                {processedImage.width} × {processedImage.height}
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">File size</span>

                              <span className="font-medium text-slate-700">
                                {(processedImage.size / 1024).toFixed(2)} KB
                              </span>
                            </div>

                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Format</span>

                              <span className="font-medium text-slate-700">
                                {processedImage.mimeType}
                              </span>
                            </div>
                          </div>

                          {/* Download */}

                          <a
                            href={processedImage.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="mt-5 block w-full rounded-xl bg-slate-900 px-5 py-3 text-center text-sm font-medium text-white transition hover:bg-slate-700"
                          >
                            Download Processed Image
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* ====================================
                        COMPRESSION SAVINGS
                    ==================================== */}

                    {batch.operation === "compress" && (
                      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-sm font-medium text-slate-600">
                            File size reduction
                          </span>

                          <span className="text-sm font-semibold text-slate-900">
                            {Math.max(
                              0,
                              (
                                (1 - processedImage.size / image.size) *
                                100
                              ).toFixed(1),
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                The batch is complete, but no images were returned.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BatchProgress;
