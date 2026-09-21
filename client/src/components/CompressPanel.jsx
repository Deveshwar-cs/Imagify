import {useState} from "react";
import api from "../services/api";

const CompressPanel = ({image, onProcessed}) => {
  const [level, setLevel] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCompress = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.post(`images/${image.id}/compress`, {
        level,
      });

      onProcessed(response.data);
    } catch (error) {
      console.error(error);

      setError(error?.response?.data?.message || "Failed to compress image");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Compress image</h3>

        <p className="mt-1 text-sm text-slate-500">
          Reduce the file size while keeping the image dimensions.
        </p>
      </div>

      <div className="mt-6">
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

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={handleCompress}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Compressing..." : "Compress Image"}
      </button>
    </div>
  );
};

export default CompressPanel;
