import {useState} from "react";
import api from "../services/api";

const UpscalePanel = ({image, onProcessed}) => {
  const [scale, setScale] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpscale = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.post(`/images/${image.id}/upscale`, {
        scale,
      });

      onProcessed(response.data);
    } catch (error) {
      console.error(error);

      setError(error.response?.data?.message || "Failed to upscale image.");
    } finally {
      setLoading(false);
    }
  };

  const previewWidth = image.width * scale;
  const previewHeight = image.height * scale;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Upscale image</h3>

        <p className="mt-1 text-sm text-slate-500">
          Increase the image dimensions by 2× or 3×.
        </p>
      </div>

      <div className="mt-6">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Upscale factor
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

      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">New dimensions</span>

          <span className="font-semibold text-slate-900">
            {previewWidth} × {previewHeight}
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={handleUpscale}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Upscaling..." : "Upscale Image"}
      </button>
    </div>
  );
};

export default UpscalePanel;
