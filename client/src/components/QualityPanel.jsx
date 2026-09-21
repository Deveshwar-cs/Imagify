import {useState} from "react";
import api from "../services/api";

const QualityPanel = ({image, onProcessed}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImproveQuality = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.post(`/images/${image.id}/quality`);

      onProcessed(response.data);
    } catch (error) {
      console.error(error);

      setError(
        error.response?.data?.message || "Failed to improve image quality.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">
          Improve image quality
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Enhance image details and sharpen the image.
        </p>
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={handleImproveQuality}
        disabled={loading}
        className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Improving..." : "Improve Quality"}
      </button>
    </div>
  );
};

export default QualityPanel;
