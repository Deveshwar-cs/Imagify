import {useState} from "react";
import {createShare} from "../../services/share.service";

const useImageShare = (batchId, batchStatus) => {
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState("");
  const [copied, setCopied] = useState(false);

  // Create temporary share URL
  const handleShare = async () => {
    if (!batchId || batchStatus?.status !== "completed") {
      setShareError("Images must be completely processed before sharing.");
      return;
    }

    try {
      setShareLoading(true);
      setShareError("");
      setCopied(false);
      setShareUrl("");

      console.log("Creating share link for batch:", batchId);

      const response = await createShare(batchId);

      console.log("Create share response:", response);

      if (!response.success) {
        setShareError(response.message || "Failed to create share link.");
        return;
      }

      const generatedShareUrl = response.share?.url;

      if (!generatedShareUrl) {
        setShareError("Share link was not returned by the server.");
        return;
      }

      // Store temporary URL.
      // Do NOT automatically copy it.
      setShareUrl(generatedShareUrl);

      console.log("Temporary share URL:", generatedShareUrl);
    } catch (error) {
      console.error("Failed to create share link:", error);

      setShareError(
        error.response?.data?.message ||
          error.message ||
          "Failed to create share link.",
      );
    } finally {
      setShareLoading(false);
    }
  };

  // Copy temporary share URL
  const handleCopyShareUrl = async () => {
    if (!shareUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy share URL:", error);

      setShareError("Failed to copy the share link.");
    }
  };

  return {
    shareUrl,
    shareLoading,
    shareError,
    copied,
    handleShare,
    handleCopyShareUrl,
  };
};

export default useImageShare;
