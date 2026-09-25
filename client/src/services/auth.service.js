import api from "./api";

export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");

  return response.data;
};

export const googleLogin = async (credential) => {
  const response = await api.post("/auth/google", {
    credential,
  });

  return response.data;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");

  return response.data;
};
