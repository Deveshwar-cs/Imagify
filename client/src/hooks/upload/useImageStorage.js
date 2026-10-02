import {useState} from "react";

import {saveProcessedImage} from "../../services/storage.service";

const useImageStorage = () => {
  const [savingImageId, setSavingImageId] = useState(null);

  const [saveError, setSaveError] = useState("");

  const [savedImages, setSavedImages] = useState([]);

  const handleSaveProcessedImage = async (batchId, resultId) => {
    if (!batchId || !resultId) {
      setSaveError("Batch ID and result ID are required.");
      return;
    }

    try {
      setSavingImageId(resultId);
      setSaveError("");

      const response = await saveProcessedImage(batchId, resultId);

      if (!response.success) {
        setSaveError(response.message || "Failed to save image to storage.");

        return;
      }

      setSavedImages((previous) => [...previous, resultId]);
    } catch (error) {
      console.error("Failed to save processed image:", error);

      setSaveError(
        error.response?.data?.message || "Failed to save image to storage.",
      );
    } finally {
      setSavingImageId(null);
    }
  };

  return {
    savingImageId,
    saveError,
    savedImages,
    handleSaveProcessedImage,
  };
};

export default useImageStorage;
