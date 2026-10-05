import {useCallback, useEffect, useState} from "react";

import {Link, useNavigate} from "react-router-dom";

import {getSubscriptionStatus} from "../services/subscription.service";

import {
  getStorageUsage,
  getStoredImages,
  uploadStoredImage,
  deleteStoredImage,
} from "../services/storage.service";

import {useAuth} from "../components/context/AuthContext";

const Storage = ({refreshKey}) => {
  const navigate = useNavigate();

  const {isAuthenticated, loading: authLoading, logout} = useAuth();

  const [subscription, setSubscription] = useState(null);
  const [images, setImages] = useState([]);
  const [usage, setUsage] = useState(null);
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ============================================
  // LOAD STORAGE DATA
  // ============================================

  const loadStorageData = useCallback(async () => {
    try {
      setLoadingData(true);
      setError("");

      const [usageResponse, imagesResponse, subscriptionResponse] =
        await Promise.all([
          getStorageUsage(),
          getStoredImages(),
          getSubscriptionStatus(),
        ]);

      setUsage(usageResponse?.usage || null);
      setImages(imagesResponse?.images || []);
      setSubscription(subscriptionResponse?.subscription || null);
    } catch (error) {
      console.error("Load storage data error:", error);

      setError(error.response?.data?.message || "Failed to load storage data.");

      setImages([]);
      setUsage(null);
      setSubscription(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }

    loadStorageData();
  }, [authLoading, isAuthenticated, refreshKey, loadStorageData]);

  // ============================================
  // LOGOUT
  // ============================================

  const handleLogout = async () => {
    await logout();

    navigate("/login", {
      replace: true,
    });
  };

  // ============================================
  // UPLOAD
  // ============================================

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const formData = new FormData();

      formData.append("image", file);

      const response = await uploadStoredImage(formData);

      setMessage(response?.message || "Image stored successfully.");

      setFile(null);

      await loadStorageData();
    } catch (error) {
      console.error("Upload stored image error:", error);

      setError(error.response?.data?.message || "Failed to upload image.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // DELETE
  // ============================================

  const handleDelete = async (imageId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this image?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await deleteStoredImage(imageId);

      setMessage("Image deleted successfully.");

      await loadStorageData();
    } catch (error) {
      console.error("Delete stored image error:", error);

      setError(error.response?.data?.message || "Failed to delete image.");
    }
  };

  // ============================================
  // AUTH LOADING
  // ============================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link to="/home" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                I
              </div>

              <span className="text-xl font-bold tracking-tight text-slate-900">
                Imagify
              </span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="h-7 w-44 rounded bg-slate-200 sm:w-52" />

            <div className="mt-3 h-4 w-full max-w-xs rounded bg-slate-100" />

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="h-48 rounded-2xl bg-slate-100" />
              <div className="h-48 rounded-2xl bg-slate-100" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ============================================
  // USAGE
  // ============================================

  const usedImages = usage?.used || 0;
  const imageLimit = usage?.limit || 0;
  const remainingImages = usage?.remaining || 0;

  const usagePercentage =
    imageLimit > 0 ? Math.min((usedImages / imageLimit) * 100, 100) : 0;

  // ============================================
  // MAIN UI
  // ============================================

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
      {/* ============================================
          HEADER
      ============================================ */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}

          <Link to="/home" className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              I
            </div>

            <span className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              Imagify
            </span>
          </Link>

          {/* Navigation */}

          <nav className="flex items-center gap-3 sm:gap-5 md:gap-8">
            <Link
              to="/home"
              className="text-xs font-medium text-slate-500 transition hover:text-slate-900 sm:text-sm"
            >
              Home
            </Link>

            <Link
              to="/upload"
              className="text-xs font-medium text-slate-500 transition hover:text-slate-900 sm:text-sm"
            >
              Upload
            </Link>

            <Link
              to="/storage"
              className="text-xs font-semibold text-slate-900 sm:text-sm"
            >
              Storage
            </Link>
          </nav>

          {/* Authentication */}

          <div className="hidden sm:flex">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-5"
            >
              Logout
            </button>
          </div>

          {/* Mobile logout */}

          <button
            type="button"
            onClick={handleLogout}
            className="ml-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:hidden"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ============================================
          MAIN
      ============================================ */}

      <main>
        {/* ============================================
            HERO
        ============================================ */}

        <section className="relative overflow-hidden bg-white">
          <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-slate-100 blur-3xl sm:-right-40 sm:-top-40 sm:h-96 sm:w-96" />

          <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-slate-100 blur-3xl sm:-bottom-40 sm:-left-40 sm:h-96 sm:w-96" />

          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 sm:mb-5 sm:px-4 sm:py-2 sm:text-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Personal image storage
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Your image storage.
                <span className="block text-slate-400">Simple and secure.</span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:mt-5 sm:text-lg sm:leading-7">
                Store your images securely and keep them available whenever you
                need them.
              </p>
            </div>
          </div>
        </section>

        {/* ============================================
            CONTENT
        ============================================ */}

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {/* ========================================
              TOP GRID
          ======================================== */}

          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            {/* Storage Usage */}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 sm:text-sm">
                    Storage
                  </p>

                  <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                    Storage usage
                  </h2>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg sm:h-11 sm:w-11">
                  ▣
                </div>
              </div>

              {usage ? (
                <>
                  <div className="mt-6 flex items-end justify-between gap-4 sm:mt-8">
                    <div>
                      <p className="text-3xl font-bold text-slate-900">
                        {usedImages}
                      </p>

                      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        images stored
                      </p>
                    </div>

                    <p className="text-xs font-medium text-slate-500 sm:text-sm">
                      {usedImages} / {imageLimit}
                    </p>
                  </div>

                  <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100 sm:h-3">
                    <div
                      className="h-full rounded-full bg-slate-900 transition-all duration-500"
                      style={{
                        width: `${usagePercentage}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-xs text-slate-500 sm:text-sm">
                      {remainingImages} image
                      {remainingImages === 1 ? "" : "s"} remaining
                    </p>

                    <p className="text-xs font-medium text-slate-700 sm:text-sm">
                      {Math.round(usagePercentage)}% used
                    </p>
                  </div>
                </>
              ) : (
                <p className="mt-8 text-sm text-slate-500">
                  Storage usage information is unavailable.
                </p>
              )}
            </div>

            {/* Upload */}

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 sm:text-sm">
                Add to storage
              </p>

              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Store a new image
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Upload an image to keep it safely in your Imagify storage.
              </p>

              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center transition hover:border-slate-400 hover:bg-slate-100 sm:mt-6 sm:px-5 sm:py-8">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm sm:h-12 sm:w-12">
                  <svg
                    className="h-6 w-6 text-slate-600"
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

                <span className="mt-4 text-sm font-semibold text-slate-800">
                  Choose an image
                </span>

                <span className="mt-1 text-xs text-slate-500">
                  PNG, JPG, JPEG or WEBP
                </span>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] || null);
                    setError("");
                    setMessage("");
                    event.target.value = "";
                  }}
                  className="hidden"
                />
              </label>

              {file && (
                <div className="mt-4 flex min-w-0 items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3 sm:px-4">
                  <p
                    className="min-w-0 truncate text-sm font-medium text-slate-700"
                    title={file.name}
                  >
                    {file.name}
                  </p>

                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="shrink-0 text-xs font-medium text-slate-400 transition hover:text-red-600 sm:text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleUpload}
                disabled={loading || !file}
                className="mt-5 w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Uploading..." : "Store Image"}
              </button>
            </div>
          </div>

          {/* ========================================
              SUBSCRIPTION STATUS
          ======================================== */}

          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 sm:text-sm">
                  Membership
                </p>

                <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Current plan
                </h2>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg sm:h-11 sm:w-11">
                ★
              </div>
            </div>

            {subscription ? (
              <>
                <div className="mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-2xl font-bold capitalize text-slate-900 sm:text-3xl">
                      {subscription.planName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {subscription.limit} images storage limit
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold capitalize text-emerald-700">
                    {subscription.status}
                  </span>
                </div>

                {subscription.cancelAtPeriodEnd && (
                  <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-medium text-amber-800">
                      Cancellation scheduled
                    </p>

                    <p className="mt-1 text-xs leading-5 text-amber-700">
                      Your {subscription.planName} plan will remain active until
                      the end of your current billing period.
                    </p>
                  </div>
                )}

                {subscription.scheduledPlan &&
                  subscription.scheduledPlan !== "none" && (
                    <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <p className="text-sm font-medium text-blue-800">
                        Plan change scheduled
                      </p>

                      <p className="mt-1 text-xs leading-5 text-blue-700">
                        Your plan will change to{" "}
                        <span className="font-semibold capitalize">
                          {subscription.scheduledPlan}
                        </span>
                        .
                      </p>
                    </div>
                  )}

                <Link
                  to="/subscription"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  Manage Membership
                </Link>
              </>
            ) : (
              <div className="mt-8">
                <p className="text-sm text-slate-500">
                  No active membership found.
                </p>

                <Link
                  to="/subscription"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 sm:w-auto"
                >
                  View Pricing
                </Link>
              </div>
            )}
          </div>

          {/* ========================================
              MESSAGES
          ======================================== */}

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          {/* ========================================
              STORED IMAGES
          ======================================== */}

          <div className="mt-10 sm:mt-12">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400 sm:text-sm">
                  Your collection
                </p>

                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Stored images
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage the images saved in your storage.
                </p>
              </div>

              <span className="w-fit rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
                {images.length} image
                {images.length === 1 ? "" : "s"}
              </span>
            </div>

            {loadingData ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"
                  >
                    <div className="h-52 bg-slate-100 sm:h-48" />

                    <div className="space-y-3 p-4">
                      <div className="h-4 w-3/4 rounded bg-slate-200" />

                      <div className="h-10 rounded-xl bg-slate-100" />

                      <div className="h-10 rounded-lg bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : images.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center sm:p-12">
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
                  No stored images yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Upload your first image using the storage area above and it
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="group min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    {/* Image */}

                    <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                      <img
                        src={image.url}
                        alt={image.originalName || "Stored image"}
                        loading="lazy"
                        className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                      />

                      <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-600 shadow-sm backdrop-blur">
                        Stored
                      </div>
                    </div>

                    {/* Details */}

                    <div className="p-4">
                      <p
                        className="truncate text-sm font-semibold text-slate-900"
                        title={image.originalName}
                      >
                        {image.originalName}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">Dimensions</p>

                          <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                            {image.width} × {image.height}
                          </p>
                        </div>

                        <div className="min-w-0 rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-400">Size</p>

                          <p className="mt-1 truncate text-sm font-semibold text-slate-700">
                            {(image.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                        <a
                          href={image.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          View
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDelete(image.id)}
                          className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ============================================
          FOOTER
      ============================================ */}

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-slate-400">
              Simple and powerful image storage.
            </p>

            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Imagify. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Storage;
