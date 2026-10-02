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

  // Create FormData for image processing
  const createProcessingFormData = (
    selectedImages,
    operation,
    options = {},
  ) => {
    const formData = new FormData();

    // Add selected image files.
    for (const file of selectedImages) {
      formData.append("images", file);
    }

    // Add operation.
    formData.append("operation", operation);

    // Convert options object to JSON string.
    formData.append("options", JSON.stringify(options));

    return formData;
  };

  // Start processing
  const startProcessing = async (selectedImages, operation, options = {}) => {
    if (selectedImages.length === 0) {
      return;
    }

    setProcessing(true);
    setProcessingError("");
    setBatchStatus(null);
    setProgress(0);

    try {
      const formData = createProcessingFormData(
        selectedImages,
        operation,
        options,
      );

      const response = await startImageProcessing(formData);

      if (!response.success) {
        throw new Error(response.message || "Failed to start image processing");
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

  // Start resize processing
  const handleResize = async (selectedImages) => {
    await startProcessing(selectedImages, "resize", resizeOptions);
  };

  // Start compression
  const handleCompress = async (selectedImages) => {
    await startProcessing(selectedImages, "compress", compressOptions);
  };

  // Start quality improvement
  const handleQuality = async (selectedImages) => {
    await startProcessing(selectedImages, "quality", {});
  };

  // Start upscale processing
  const handleUpscale = async (selectedImages) => {
    await startProcessing(selectedImages, "upscale", upscaleOptions);
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
