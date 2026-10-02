import api from "./api";

export const startImageProcessing = async (formData) => {
  const response = await api.post("/images/process", formData);

  return response.data;
};

export const getBatchStatus = async (batchId) => {
  const response = await api.get(`/images/batches/${batchId}`);

  return response.data;
};
