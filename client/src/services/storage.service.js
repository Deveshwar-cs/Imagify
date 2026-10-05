import api from "./api";

export const getStorageUsage = async () => {
  const response = await api.get("/storage/usage");
  return response.data;
};

export const getStoredImages = async () => {
  const response = await api.get("/storage/images");

  return response.data;
};

export const uploadStoredImage = async (formData) => {
  const response = await api.post("/storage/upload", formData);

  return response.data;
};

export const deleteStoredImage = async (imageId) => {
  const response = await api.delete(`/storage/images/${imageId}`);

  return response.data;
};

export const saveProcessedImage = async (batchId, resultId) => {
  const response = await api.post("/storage/save-processed", {
    batchId,
    resultId,
  });

  return response.data;
};
