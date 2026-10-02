import {useEffect, useState} from "react";

const useImageUpload = () => {
  const [files, setFiles] = useState([]);

  const [previews, setPreviews] = useState([]);

  const [selectedImages, setSelectedImages] = useState([]);

  const [loading, setLoading] = useState(false);

  const [uploadError, setUploadError] = useState(null);

  // ============================================================
  // Create previews when files are selected
  // ============================================================

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (selectedFiles.length === 0) {
      return;
    }

    const newPreviews = selectedFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    setFiles((prev) => [...prev, ...selectedFiles]);

    setPreviews((prev) => [...prev, ...newPreviews]);

    // Allow selecting the same file again
    event.target.value = "";
  };

  // ============================================================
  // Remove a selected file
  // ============================================================

  const removeFile = (index) => {
    const fileToRemove = files[index];

    setPreviews((prev) => {
      const preview = prev[index];

      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }

      return prev.filter((_, i) => i !== index);
    });

    setFiles((prev) => prev.filter((_, i) => i !== index));

    // Remove the same File object from selection
    setSelectedImages((prev) => prev.filter((file) => file !== fileToRemove));
  };

  // ============================================================
  // Select / unselect an image
  // ============================================================

  const toggleImageSelection = (file) => {
    setSelectedImages((prev) => {
      const alreadySelected = prev.includes(file);

      if (alreadySelected) {
        return prev.filter((selectedFile) => selectedFile !== file);
      }

      return [...prev, file];
    });
  };

  // ============================================================
  // Select all images
  // ============================================================

  const handleSelectAll = () => {
    setSelectedImages([...files]);
  };

  // ============================================================
  // Clear image selection
  // ============================================================

  const handleClearSelection = () => {
    setSelectedImages([]);
  };

  // ============================================================
  // Clear files after processing starts
  // ============================================================

  const clearFiles = () => {
    setFiles([]);

    setPreviews((prev) => {
      prev.forEach((preview) => {
        if (preview?.url) {
          URL.revokeObjectURL(preview.url);
        }
      });

      return [];
    });

    setSelectedImages([]);
  };

  // ============================================================
  // Cleanup preview URLs
  // ============================================================

  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        if (preview?.url) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [previews]);

  return {
    files,
    previews,
    selectedImages,

    loading,
    setLoading,

    uploadError,
    setUploadError,

    handleFileChange,
    removeFile,

    toggleImageSelection,
    handleSelectAll,
    handleClearSelection,

    clearFiles,
  };
};

export default useImageUpload;
