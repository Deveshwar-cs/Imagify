import api from "./api";

export const getStorageUsage = async () => {
  const response = await api.get("/storage/usage");
  console.log(response);
  return response.data;
};

export const getStoredImages = async () => {
  const response = await api.get("/storage/images");
  console.log(response);

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
