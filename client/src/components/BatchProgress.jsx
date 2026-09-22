import {useEffect, useState} from "react";

import api from "../services/api";

const BatchProgress = ({batchId}) => {
  console.log("BatchProgress received batchId:", batchId);

  const [batch, setBatch] = useState(null);
  const [error, setError] = useState("");

  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (!batchId) {
      return;
    }

    let intervalId;

    const fetchBatchStatus = async () => {
      try {
        const response = await api.get(`/images/batches/${batchId}`);

        console.log("Batch API response:", response.data.batch);

        setBatch(response.data.batch);
        setError("");

        const status = response.data.batch.status;

        if (status === "completed" || status === "failed") {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Failed to fetch batch status:", error);

        setError(
          error.response?.data?.message || "Failed to get processing status.",
        );
      }
    };

    fetchBatchStatus();

    intervalId = setInterval(fetchBatchStatus, 2000);

    return () => {
      clearInterval(intervalId);
    };
  }, [batchId]);

  if (!batch && !error) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Checking processing status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  const progress = batch.progress || 0;

  const isCompleted = batch.status === "completed";

  const isFailed = batch.status === "failed";

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
              {batch.completedImages} of {batch.totalImages} images completed
            </p>
          </div>

          <span className="text-sm font-semibold text-slate-700">
            {progress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900 transition-all duration-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="capitalize text-slate-500">{batch.operation}</span>

          <span className="font-medium text-slate-700">
            {batch.completedImages} / {batch.totalImages}
          </span>
        </div>

        {batch.failedImages > 0 && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {batch.failedImages} image
            {batch.failedImages > 1 ? "s" : ""} failed to process.
          </div>
        )}
      </div>

      {/* Completed Results */}
      {isCompleted && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Your images are ready
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Compare your original and processed images before downloading.
            </p>
          </div>

          {/* Share Section */}
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

            <button
              onClick={handleShare}
              disabled={shareLoading}
              className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {shareLoading ? "Creating share link..." : "Share Results"}
            </button>

            {shareError && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {shareError}
              </p>
            )}

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

          {/* Images */}
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
                    {/* Image Comparison */}
                    <div className="grid md:grid-cols-2">
                      {/* Original */}
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

                      {/* Processed */}
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

                    {/* Compression Savings */}
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
