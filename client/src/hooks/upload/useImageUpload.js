import {useEffect, useState} from "react";
import {uploadImages} from "../../services/image.service";

const useImageUpload = () => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create previews when files are selected
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

  // Remove a selected file
  const removeFile = (index) => {
    setPreviews((prev) => {
      const preview = prev[index];

      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }

      return prev.filter((_, i) => i !== index);
    });

    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload selected files
  const handleUpload = async () => {
    if (files.length === 0) {
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await uploadImages(formData);

      if (response.success) {
        setUploadedImages((prev) => [...prev, ...(response.images || [])]);

        setFiles([]);

        setPreviews((prev) => {
          prev.forEach((preview) => {
            if (preview?.url) {
              URL.revokeObjectURL(preview.url);
            }
          });

          return [];
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Select / unselect an uploaded image
  const toggleImageSelection = (imageId) => {
    setSelectedImages((prev) => {
      if (prev.includes(imageId)) {
        return prev.filter((id) => id !== imageId);
      }

      return [...prev, imageId];
    });
  };

  // Select all uploaded images
  const handleSelectAll = () => {
    setSelectedImages(uploadedImages.map((image) => image.id));
  };

  // Clear image selection
  const handleClearSelection = () => {
    setSelectedImages([]);
  };

  // Cleanup preview URLs when component unmounts
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
    uploadedImages,
    setUploadedImages,
    selectedImages,
    loading,

    handleFileChange,
    removeFile,
    handleUpload,

    toggleImageSelection,
    handleSelectAll,
    handleClearSelection,
  };
};

export default useImageUpload;
