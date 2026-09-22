import {useState} from "react";

import api from "../services/api";

const BatchProcessingPanel = ({images, onProcessingStarted}) => {
  const [operation, setOperation] = useState("compress");

  const [level, setLevel] = useState("medium");

  const [scale, setScale] = useState(2);

  const [width, setWidth] = useState("");

  const [height, setHeight] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const handleStartProcessing = async () => {
    if (!images || images.length === 0) {
      setError("Please upload at least one image.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const imageIds = images.map((image) => image.id);

      let options = {};

      // Resize options
      if (operation === "resize") {
        if (!width && !height) {
          setError("Please enter a maximum width or maximum height.");

          setLoading(false);

          return;
        }

        if (width && (!Number.isFinite(Number(width)) || Number(width) <= 0)) {
          setError("Maximum width must be a valid positive number.");

          setLoading(false);

          return;
        }

        if (
          height &&
          (!Number.isFinite(Number(height)) || Number(height) <= 0)
        ) {
          setError("Maximum height must be a valid positive number.");

          setLoading(false);

          return;
        }

        options = {
          width: width ? Number(width) : undefined,

          height: height ? Number(height) : undefined,
        };
      }

      // Compression options
      if (operation === "compress") {
        options = {
          level,
        };
      }

      // Upscale options
      if (operation === "upscale") {
        options = {
          scale: Number(scale),
        };
      }

      const response = await api.post("/images/process", {
        imageIds,
        operation,
        options,
      });

      console.log("Calling onProcessingStarted with:", response.data);

      console.log("Processing batch:", response.data);

      onProcessingStarted(response.data);
    } catch (error) {
      console.error("Failed to start processing:", error);

      setError(
        error.response?.data?.message || "Failed to start image processing.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Process Images</h2>

        <p className="mt-1 text-sm text-slate-500">
          Choose an operation and process all selected images together.
        </p>
      </div>

      {/* Operation */}
      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Operation
        </label>

        <select
          value={operation}
          onChange={(event) => {
            setOperation(event.target.value);
            setError("");
          }}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
        >
          <option value="resize">Resize</option>

          <option value="compress">Compress</option>

          <option value="quality">Improve Quality</option>

          <option value="upscale">Upscale</option>
        </select>
      </div>

      {/* Resize */}
      {operation === "resize" && (
        <div className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Maximum Width */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Maximum Width
              </label>

              <input
                type="number"
                min="1"
                value={width}
                onChange={(event) => setWidth(event.target.value)}
                placeholder="e.g. 800"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
              />

              <p className="mt-2 text-xs text-slate-500">
                Maximum allowed width in pixels.
              </p>
            </div>

            {/* Maximum Height */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Maximum Height
              </label>

              <input
                type="number"
                min="1"
                value={height}
                onChange={(event) => setHeight(event.target.value)}
                placeholder="e.g. 600"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
              />

              <p className="mt-2 text-xs text-slate-500">
                Maximum allowed height in pixels.
              </p>
            </div>
          </div>

          {/* Aspect Ratio Information */}
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">
                Aspect ratio preserved:
              </span>{" "}
              Images will be resized proportionally to fit within these
              dimensions.
            </p>
          </div>
        </div>
      )}

      {/* Compression */}
      {operation === "compress" && (
        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Compression level
          </label>

          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
          >
            <option value="low">Low — Better quality</option>

            <option value="medium">Medium — Balanced</option>

            <option value="high">High — Smaller file</option>
          </select>
        </div>
      )}

      {/* Upscale */}
      {operation === "upscale" && (
        <div className="mt-5">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Upscale
          </label>

          <select
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-slate-400"
          >
            <option value={2}>2×</option>

            <option value={3}>3×</option>
          </select>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Process Button */}
      <button
        onClick={handleStartProcessing}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Starting..." : `Process ${images?.length || 0} Images`}
      </button>
    </div>
  );
};

export default BatchProcessingPanel;
