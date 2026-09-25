import api from "./api";

export const upscaleImage = async (imageId, data) => {
  const response = await api.post(`/images/${imageId}/upscale`, data);

  return response.data;
};

export const improveImageQuality = async (imageId) => {
  const response = await api.post(`/images/${imageId}/quality`);

  return response.data;
};

export const resizeImage = async (imageId, data) => {
  const response = await api.post(`/images/${imageId}/resize`, data);

  return response.data;
};

export const compressImage = async (imageId, data) => {
  const response = await api.post(`/images/${imageId}/compress`, data);

  return response.data;
};
