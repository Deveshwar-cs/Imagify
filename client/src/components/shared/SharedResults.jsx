import {useEffect, useState} from "react";

import {useParams} from "react-router-dom";

import {
  getSharedResults,
  getSharedProcessedImage,
} from "../../services/share.service";

const SharedResults = () => {
  const {token} = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSharedResults = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getSharedResults(token);

        setData(response);
      } catch (error) {
        console.error("Failed to load shared results:", error);

        if (error.response?.status === 410) {
          setError("This share link has expired.");
        } else if (error.response?.status === 404) {
          setError("This share link was not found.");
        } else {
          setError(
            error.response?.data?.message || "Failed to load shared results.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedResults();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Loading shared results...
          </p>

          <p className="mt-1 text-xs text-slate-400">Preparing your images</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <svg
              className="h-7 w-7 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 9v3.5m0 3h.01M10.3 4.7l-7 12.1A2 2 0 005 20h14a2 2 0 001.7-3.2l-7-12.1a2 2 0 00-3.4 0z"
              />
            </svg>
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
            Unable to open shared results
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const batch = data?.batch;

  if (!batch) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              I
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-900">Imagify</p>

              <p className="text-xs text-slate-400">
                Image processing platform
              </p>
            </div>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
            Shared Results
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Page heading */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Shared processing results
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Processed Images
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                  View the processed images and their transformation details
                  from this shared Imagify result.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Operation
                </span>

                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-semibold capitalize text-slate-700">
                  {batch.operation}
                </span>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-6">
            {batch.images.map((image, index) => {
              const processed = image.processedImage;

              const processedUrl = processed
                ? getSharedProcessedImage(token, processed.id)
                : null;

              return (
                <article
                  key={image.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
                >
                  {/* Card header */}
                  <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-semibold text-slate-600">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                            {image.originalName}
                          </h2>

                          <p className="mt-1 text-xs text-slate-400">
                            Original file
                          </p>
                        </div>
                      </div>

                      {processed && (
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Processed successfully
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Image */}
                  {processed && processedUrl ? (
                    <div className="p-4 sm:p-6">
                      <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                        <div className="flex min-h-80 items-center justify-center p-4 sm:min-h-105 sm:p-8">
                          <img
                            src={processedUrl}
                            alt={image.originalName}
                            loading="lazy"
                            className="max-h-125 w-full rounded-xl object-contain transition duration-500 group-hover:scale-[1.01]"
                            onLoad={() => {
                              console.log("Shared image loaded:", image.id);
                            }}
                            onError={(event) => {
                              console.error("Shared image failed to load:", {
                                imageId: image.id,
                                url: processedUrl,
                                event,
                              });
                            }}
                          />
                        </div>
                      </div>

                      {/* Image information */}
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Original size
                          </p>

                          <p className="mt-1.5 text-sm font-semibold text-slate-800">
                            {(image.size / 1024).toFixed(2)} KB
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Dimensions
                          </p>

                          <p className="mt-1.5 text-sm font-semibold text-slate-800">
                            {processed.width} × {processed.height}
                          </p>
                        </div>

                        <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <a
                            href={processedUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                          >
                            View Full Image
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.8}
                                d="M13 5h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="m-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center sm:m-6">
                      <p className="text-sm font-medium text-slate-600">
                        Processed image is not available
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        The processed file could not be loaded.
                      </p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Expiration */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:px-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M12 8v4l2.5 1.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>

                <p className="text-xs text-slate-500">
                  This share link expires on
                </p>
              </div>

              <p className="text-xs font-medium text-slate-700">
                {new Date(data.share.expiresAt).toLocaleString("en-US", {
                  month: "long",
                  day: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="py-8 text-center">
            <p className="text-xs text-slate-400">
              Shared securely through{" "}
              <span className="font-medium text-slate-500">Imagify</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SharedResults;
