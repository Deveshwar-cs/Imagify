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

        console.log("Fetching shared results...");

        const response = await getSharedResults(token);

        console.log("Shared results response:", response);

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
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />

          <p className="mt-4 text-sm text-slate-500">
            Loading shared results...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">
            Unable to open shared results
          </h1>

          <p className="mt-3 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const batch = data?.batch;

  if (!batch) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Shared Imagify Results
            </p>

            <h1 className="mt-2 text-2xl font-semibold text-slate-900">
              Processed Images
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Operation: {batch.operation}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {batch.images.map((image) => {
              const processed = image.processedImage;

              const processedUrl = processed
                ? getSharedProcessedImage(token, image.id)
                : null;

              console.log("Shared image:", {
                imageId: image.id,
                processed,
                processedUrl,
              });

              return (
                <div
                  key={image.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div>
                    <h2 className="font-medium text-slate-900">
                      {image.originalName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Original: {image.width} × {image.height}
                    </p>

                    {processed && (
                      <p className="mt-1 text-sm text-slate-500">
                        Processed: {processed.width} × {processed.height}
                      </p>
                    )}
                  </div>

                  {processed && processedUrl ? (
                    <div className="mt-5">
                      <img
                        src={processedUrl}
                        alt={image.originalName}
                        className="max-h-[500px] w-full rounded-2xl bg-slate-100 object-contain"
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

                      <div className="mt-4">
                        <a
                          href={processedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                          View Image
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      Processed image is not available.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <p className="text-xs text-slate-400">
              This share link expires at{" "}
              {new Date(data.share.expiresAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedResults;
