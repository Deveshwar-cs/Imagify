import {useEffect, useState} from "react";

import {Link, useSearchParams} from "react-router-dom";

import {getBatchStatus} from "../services/image.service";

const NotificationResults = () => {
  const [searchParams] = useSearchParams();

  const batchId = searchParams.get("batch");

  const [batch, setBatch] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const handleDownload = async (url) => {
    try {
      const response = await fetch(url);

      const blob = await response.blob();

      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = "Imagify_image_screenshot.jpg";

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Image download error", error);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 Bytes";
    }

    const units = ["Bytes", "KB", "MB", "GB"];

    const index = Math.floor(Math.log(bytes) / Math.log(1024));

    return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
  };

  useEffect(() => {
    if (!batchId) {
      setError("Batch ID is missing.");

      setLoading(false);

      return;
    }

    const fetchBatch = async () => {
      try {
        setLoading(true);

        setError("");

        const response = await getBatchStatus(batchId);
        console.log(response);
        setBatch(response.batch);
      } catch (error) {
        console.error("Failed to fetch batch:", error);

        setError(
          error?.response?.data?.message || "Failed to load processed images.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

          <p className="text-sm text-slate-500">
            Loading your processed images...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Unable to load results
          </h1>

          <p className="mt-2 text-sm text-red-600">{error}</p>

          <Link
            to="/upload"
            className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Go to Upload
          </Link>
        </div>
      </div>
    );
  }

  if (!batch) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Header */}

        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Processing Complete
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Your images are ready
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-500 sm:text-base">
            Your processed images are ready to download.
          </p>
        </div>

        {/* Batch information */}

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Operation
              </p>

              <p className="mt-1 font-semibold capitalize text-slate-900">
                {batch.operation}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Total Images
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {batch.totalImages}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Completed
              </p>

              <p className="mt-1 font-semibold text-green-600">
                {batch.completedImages}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Failed
              </p>

              <p className="mt-1 font-semibold text-red-600">
                {batch.failedImages}
              </p>
            </div>
          </div>
        </div>

        {/* Processed Images */}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Processed Images
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Compare your original images with the processed results.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {batch.images?.map((image) => {
              /*
               * Find the processed result belonging to this
               * original image.
               *
               * The ProcessingBatch now stores:
               *
               * batch.images  -> original images
               * batch.results -> processed images
               */

              const processedImage = batch.results?.find(
                (result) => result.originalName === image.originalName,
              );

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

                  {/* Download */}

                  <div className="border-t border-slate-200 bg-white p-4">
                    {/* <a
                      href={processedImage.url}
                      download={processedImage.fileName}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full rounded-xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Download
                    </a> */}

                    <button
                      onClick={() => handleDownload(processedImage.url)}
                      className="block w-full rounded-xl cursor-pointer bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-700"
                    >
                      Download Image
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Back */}

        <div className="mt-8 text-center">
          <Link
            to="/upload"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Upload
          </Link>
        </div>
      </main>
    </div>
  );
};

export default NotificationResults;
