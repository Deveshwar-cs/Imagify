import {useEffect, useState} from "react";
import api from "../services/api";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

const ImageUploader = ({onUploaded}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const processFile = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    setError("");
    setUploadedImage(null);

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Only JPG, PNG, and WEBP images are supported.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("Image size must be less than 10 MB.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selectedFile);

    const previewUrl = URL.createObjectURL(selectedFile);
    setPreview(previewUrl);
  };

  const handleFileChange = (event) => {
    processFile(event.target.files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files[0];

    processFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();

      formData.append("image", file);

      const response = await api.post("/images/upload", formData);

      setUploadedImage(response.data.image);
      onUploaded(response.data.image);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message ||
          "Something went wrong while uploading the image.",
      );
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(null);
    setPreview(null);
    setUploadedImage(null);
    setError("");
  };
  return (
    <div className="w-full">
      {!file && (
        <label
          htmlFor="image-upload"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
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
            Drop your image here
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
            <span>Max 10 MB</span>
          </div>

          <input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {file && (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="grid md:grid-cols-2">
            <div className="flex min-h-96 items-center justify-center bg-slate-100 p-6">
              <img
                src={preview}
                alt="Selected image"
                className="max-h-105 max-w-full rounded-xl object-contain shadow-sm"
              />
            </div>

            <div className="flex flex-col justify-center p-8">
              <span className="text-sm font-medium text-slate-500">
                Selected image
              </span>

              <h2 className="mt-2 break-all text-xl font-semibold text-slate-900">
                {file.name}
              </h2>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-500">File size</span>

                  <span className="text-sm font-medium">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>

                <div className="flex justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span className="text-sm text-slate-500">Format</span>

                  <span className="text-sm font-medium">
                    {file.type.split("/")[1].toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Uploading..." : "Upload Image"}
                </button>

                <button
                  onClick={reset}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          {uploadedImage && (
            <div className="border-t border-slate-200 p-6">
              <div className="rounded-2xl bg-green-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700">
                    ✓
                  </div>

                  <div>
                    <h3 className="font-semibold text-green-900">
                      Image uploaded successfully
                    </h3>

                    <p className="text-sm text-green-700">
                      Your image is ready to be processed.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-slate-400">Dimensions</p>

                    <p className="mt-1 font-semibold">
                      {uploadedImage.width} × {uploadedImage.height}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-slate-400">Size</p>

                    <p className="mt-1 font-semibold">
                      {(uploadedImage.size / 1024).toFixed(2)} KB
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-4">
                    <p className="text-xs text-slate-400">Format</p>

                    <p className="mt-1 font-semibold uppercase">
                      {uploadedImage.mimeType.split("/")[1]}
                    </p>
                  </div>
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
