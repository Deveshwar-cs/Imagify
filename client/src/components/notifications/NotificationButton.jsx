import {useState} from "react";

import {subscribeToPush} from "../../services/push";

const NotificationButton = () => {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");

  const handleEnableNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      await subscribeToPush();

      setEnabled(true);
    } catch (error) {
      console.error("Notification subscription error:", error);

      setError(error.message || "Failed to enable notifications.");
    } finally {
      setLoading(false);
    }
  };

  if (enabled) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
        ✓ Notifications enabled
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleEnableNotifications}
        disabled={loading}
        className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Enabling..." : "Enable Notifications"}
      </button>

      {error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default NotificationButton;
