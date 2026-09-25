import {useEffect, useState} from "react";
import {
  getBatchStatus,
  startImageProcessing,
} from "../../services/image.service";

const useImageProcessing = () => {
  const [batchId, setBatchId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [progress, setProgress] = useState(0);

  const [processing, setProcessing] = useState(false);
  const [processingError, setProcessingError] = useState("");

  const [resizeOptions, setResizeOptions] = useState({
    width: "",
    height: "",
    maintainAspectRatio: true,
  });

  const [compressOptions, setCompressOptions] = useState({
    level: "medium",
  });

  const [upscaleOptions, setUpscaleOptions] = useState({
    scale: 2,
  });

  // Handle processing errors
  const handleProcessingError = (error) => {
    console.error("Processing error:", error);

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to process images.";

    setProcessingError(message);
    setProcessing(false);
  };

  // Start resize processing
  const handleResize = async (selectedImages) => {
    if (selectedImages.length === 0) {
      return;
    }

    setProcessing(true);
    setProcessingError("");
    setBatchStatus(null);
    setProgress(0);

    try {
      const response = await startImageProcessing({
        imageIds: selectedImages,
        operation: "resize",
        options: resizeOptions,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Failed to start resize processing",
        );
      }

      setBatchId(response.batchId);
      setBatchStatus({
        status: "processing",
        totalImages: response.totalImages,
        completedImages: 0,
        failedImages: 0,
      });
    } catch (error) {
      handleProcessingError(error);
    }
  };

  // Start compression
  const handleCompress = async (selectedImages) => {
    if (selectedImages.length === 0) {
      return;
    }

    setProcessing(true);
    setProcessingError("");
    setBatchStatus(null);
    setProgress(0);

    try {
      const response = await startImageProcessing({
        imageIds: selectedImages,
        operation: "compress",
        options: compressOptions,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to start compression");
      }

      setBatchId(response.batchId);
      setBatchStatus({
        status: "processing",
        totalImages: response.totalImages,
        completedImages: 0,
        failedImages: 0,
      });
    } catch (error) {
      handleProcessingError(error);
    }
  };

  // Start quality improvement
  const handleQuality = async (selectedImages) => {
    if (selectedImages.length === 0) {
      return;
    }

    setProcessing(true);
    setProcessingError("");
    setBatchStatus(null);
    setProgress(0);

    try {
      const response = await startImageProcessing({
        imageIds: selectedImages,
        operation: "quality",
        options: {},
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to improve image quality");
      }

      setBatchId(response.batchId);
      setBatchStatus({
        status: "processing",
        totalImages: response.totalImages,
        completedImages: 0,
        failedImages: 0,
      });
    } catch (error) {
      handleProcessingError(error);
    }
  };

  // Start upscale processing
  const handleUpscale = async (selectedImages) => {
    if (selectedImages.length === 0) {
      return;
    }

    setProcessing(true);
    setProcessingError("");
    setBatchStatus(null);
    setProgress(0);

    try {
      const response = await startImageProcessing({
        imageIds: selectedImages,
        operation: "upscale",
        options: upscaleOptions,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to upscale images");
      }

      setBatchId(response.batchId);
      setBatchStatus({
        status: "processing",
        totalImages: response.totalImages,
        completedImages: 0,
        failedImages: 0,
      });
    } catch (error) {
      handleProcessingError(error);
    }
  };

  // Poll batch status
  useEffect(() => {
    if (!batchId) {
      return;
    }

    let intervalId;
    let cancelled = false;

    const checkBatchStatus = async () => {
      try {
        const response = await getBatchStatus(batchId);

        if (cancelled) {
          return;
        }

        if (!response.success) {
          throw new Error(response.message || "Failed to get batch status");
        }

        const batch = response.batch;

        setBatchStatus(batch);

        setProgress(batch.progress || 0);

        if (batch.status === "completed" || batch.status === "failed") {
          setProcessing(false);

          if (batch.status === "failed") {
            setProcessingError("Image processing failed. Please try again.");
          }

          clearInterval(intervalId);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("Batch status error:", error);

        setProcessingError(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to get processing status.",
        );

        setProcessing(false);

        clearInterval(intervalId);
      }
    };

    // Check immediately
    checkBatchStatus();

    // Then check every 2 seconds
    intervalId = setInterval(checkBatchStatus, 2000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [batchId]);

  return {
    batchId,
    batchStatus,
    progress,

    processing,
    processingError,

    resizeOptions,
    setResizeOptions,

    compressOptions,
    setCompressOptions,

    upscaleOptions,
    setUpscaleOptions,

    handleResize,
    handleCompress,
    handleQuality,
    handleUpscale,

    handleProcessingError,
  };
};

export default useImageProcessing;
