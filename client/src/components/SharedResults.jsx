import {useEffect, useState} from "react";
import {useParams} from "react-router-dom";

import api from "../services/api";

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

        const response = await api.get(`/images/share/${token}`);

        setData(response.data);
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
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
            !
          </div>

          <h1 className="mt-5 text-2xl font-semibold text-slate-900">
            Unable to open share link
          </h1>

          <p className="mt-3 text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const batch = data?.batch;

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
        <div className="text-center">
          <p className="text-sm font-medium text-slate-500">Imagify</p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Shared Image Results
          </h1>

          <p className="mt-3 text-sm text-slate-500">
            These results were temporarily shared with you.
          </p>
        </div>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Operation</p>

              <p className="mt-1 font-semibold capitalize text-slate-900">
                {batch.operation}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Images</p>

              <p className="mt-1 font-semibold text-slate-900">
                {batch.totalImages}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Link expires</p>

              <p className="mt-1 font-semibold text-slate-900">
                {new Date(data.share.expiresAt).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 space-y-6">
          {batch.images.map((image) => {
            const processed = image.processedImage;

            const processedUrl = processed
              ? `${import.meta.env.VITE_API_URL}/api/images/share/${token}/processed/${image.id}`
              : null;

            return (
              <div
                key={image.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="font-semibold text-slate-900">
                  {image.originalName}
                </h2>

                {processed && processedUrl && (
                  <div className="mt-6">
                    <img
                      src={processedUrl}
                      alt={image.originalName}
                      className="max-h-[500px] w-full rounded-2xl object-contain"
                    />

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                      <div className="text-sm text-slate-500">
                        <p>
                          {processed.width} × {processed.height}
                        </p>

                        <p>{(processed.size / 1024).toFixed(1)} KB</p>
                      </div>

                      <a
                        href={processedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                      >
                        View Image
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
};

export default SharedResults;
