import {useEffect, useState} from "react";
import api from "../services/api";

const ResizePanel = ({image, onProcessed}) => {
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [maintainRatio, setMaintainRatio] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const aspectRatio = image.width / image.height;

  useEffect(() => {
    if (!width || !maintainRatio) {
      return;
    }

    const newHeight = Math.round(Number(width) / aspectRatio);

    setHeight(newHeight);
  }, [width, maintainRatio, aspectRatio]);

  const handleWidthChange = (event) => {
    setWidth(event.target.value);
  };

  const handleHeightChange = (event) => {
    const value = event.target.value;

    setHeight(value);

    if (maintainRatio && value) {
      const newWidth = Math.round(Number(value) * aspectRatio);

      setWidth(newWidth);
    }
  };

  const handleResize = async () => {
    if (!width && !height) {
      setError("Enter a width or height.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post(`/images/${image.id}/resize`, {
        width: width || undefined,
        height: height || undefined,
      });

      onProcessed(response.data);
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Failed to resize image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h3 className="text-lg font-semibold">Resize image</h3>

        <p className="mt-1 text-sm text-slate-500">
          Original: {image.width} × {image.height}
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Width</label>

          <input
            type="number"
            min="1"
            value={width}
            onChange={handleWidthChange}
            placeholder={image.width}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Height</label>

          <input
            type="number"
            min="1"
            value={height}
            onChange={handleHeightChange}
            placeholder={image.height}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={maintainRatio}
          onChange={(event) => setMaintainRatio(event.target.checked)}
          className="h-4 w-4"
        />

        <span className="text-sm text-slate-600">Maintain aspect ratio</span>
      </label>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={handleResize}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Processing..." : "Resize Image"}
      </button>
    </div>
  );
};

export default ResizePanel;
