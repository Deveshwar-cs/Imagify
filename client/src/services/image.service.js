import api from "./api";

export const uploadImages = async (formData) => {
  const response = await api.post("/images/upload", formData);

  return response.data;
};

export const startImageProcessing = async (data) => {
  const response = await api.post("/images/process", data);

  return response.data;
};

export const getBatchStatus = async (batchId) => {
  const response = await api.get(`/images/batches/${batchId}`);

  return response.data;
};
