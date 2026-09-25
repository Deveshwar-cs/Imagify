import {useEffect, useState} from "react";

import {
  getStorageUsage,
  getStoredImages,
  uploadStoredImage,
  deleteStoredImage,
} from "../services/storage.service";
const Storage = ({refreshKey}) => {
  const [images, setImages] = useState([]);
  const [usage, setUsage] = useState(null);

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  // console.log(usage);
  const loadStorageData = async () => {
    try {
      setLoadingData(true);
      setError("");

      const [usageResponse, imagesResponse] = await Promise.all([
        getStorageUsage(),
        getStoredImages(),
      ]);
      console.log(usageResponse);
      console.log(imagesResponse);
      setUsage(usageResponse?.usage || null);

      setImages(imagesResponse?.images || []);
    } catch (error) {
      console.error("Load storage data error:", error);

      setError(error.response?.data?.message || "Failed to load storage data.");

      setImages([]);
      setUsage(null);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    console.log("Hello data");

    loadStorageData();
  }, [refreshKey]);

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

  if (loadingData) {
    return (
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Loading storage...</p>
      </section>
    );
  }

  const usedImages = usage?.used || 0;
  const imageLimit = usage?.limit || 0;
  const remainingImages = usage?.remaining || 0;

  const usagePercentage =
    imageLimit > 0 ? Math.min((usedImages / imageLimit) * 100, 100) : 0;

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}

      <div>
        <h2 className="text-xl font-semibold text-slate-900">Image Storage</h2>

        <p className="mt-1 text-sm text-slate-500">
          Store your images securely in your subscription storage.
        </p>
      </div>

      {/* Usage */}

      {usage && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Storage usage
            </span>

            <span className="text-sm text-slate-500">
              {usedImages} / {imageLimit} images
            </span>
          </div>

          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-900 transition-all"
              style={{
                width: `${usagePercentage}%`,
              }}
            />
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {remainingImages} image
            {remainingImages === 1 ? "" : "s"} remaining
          </p>
        </div>
      )}

      {/* Upload */}

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-5">
        <label className="block text-sm font-medium text-slate-700">
          Upload image
        </label>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            setFile(event.target.files?.[0] || null);

            setError("");
            setMessage("");
          }}
          className="mt-3 block w-full text-sm text-slate-600"
        />

        {file && (
          <p className="mt-2 text-sm text-slate-500">Selected: {file.name}</p>
        )}

        <button
          type="button"
          onClick={handleUpload}
          disabled={loading}
          className="mt-4 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Store Image"}
        </button>
      </div>

      {/* Messages */}

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {/* Stored Images */}

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Stored images
          </h3>

          <span className="text-sm text-slate-500">
            {images?.length || 0} image
            {images?.length === 1 ? "" : "s"}
          </span>
        </div>

        {images?.length === 0 ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-500">
              You haven't stored any images yet.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(images || []).map((image) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white"
              >
                <img
                  src={image.url}
                  alt={image.originalName}
                  className="h-48 w-full object-cover"
                />

                <div className="p-4">
                  <p
                    className="truncate text-sm font-medium text-slate-900"
                    title={image.originalName}
                  >
                    {image.originalName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {image.width} × {image.height}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {(image.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={image.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      View
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDelete(image.id)}
                      className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
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
  );
};

export default Storage;
