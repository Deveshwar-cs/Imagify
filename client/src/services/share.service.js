import api from "./api";

export const createShare = async (batchId) => {
  const response = await api.post("/images/share", {
    batchId,
  });

  return response.data;
};

export const getSharedResults = async (token) => {
  const response = await api.get(`/images/share/${token}`);
  return response.data;
};

export const getSharedProcessedImage = (token, imageId) => {
  return `${api.defaults.baseURL}/images/share/${token}/processed/${imageId}`;
};
