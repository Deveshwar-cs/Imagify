import api from "./api";

export const startImageProcessing = async (formData) => {
  const response = await api.post("/images/process", formData);
  console.log(response.data);
  return response.data;
};

export const getBatchStatus = async (batchId) => {
  const response = await api.get(`/images/batches/${batchId}`);
  console.log(response.data);
  return response.data;
};
