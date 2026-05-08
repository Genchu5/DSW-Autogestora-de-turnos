import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // marca este request como retry

      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_API_URL}/refreshToken`, 
          { withCredentials: true }
        );

        localStorage.setItem("token", data.token);
        // Reintenta **solo una vez**
        originalRequest.headers.Authorization = `Bearer ${data.token}`;  //Actualiza el header del request original
        return api(originalRequest);
      } catch (refreshError) {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL || "/api" }/logout`, {}, { withCredentials: true });
        } catch (logoutError) {
          console.error("Error cerrando sesión:", logoutError);
        } finally {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
