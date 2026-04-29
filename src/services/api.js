import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5500/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let memoryToken = "";
let isRefreshing = false;
let refreshSubscribers = [];

export const setAccessTokenInApi = (token) => {
  memoryToken = token;
};

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

function onRefreshed(token) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// ── INTERCEPTOR 1:  ──────────────────────────
API.interceptors.request.use(
  (config) => {
    if (memoryToken) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── INTERCEPTOR 2:  ──────────────────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/users/refresh") &&
      !originalRequest.url.includes("/users/login")
    ) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(API(originalRequest));
          });
        });
      }
      isRefreshing = true;

      try {
        const res = await API.post("/users/refresh");
        const { accessToken } = res.data;

        setAccessTokenInApi(accessToken);
        onRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return API(originalRequest);
      } catch (refreshErr) {
        console.log("API ERROR");
        setAccessTokenInApi("");

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  },
);

// ── Stores ──────────────────────────────────────────────────
export const getStores = (params) => API.get("/stores", { params });
export const getStoreById = (id) => API.get(`/stores/${id}`);
export const createStore = (data) => API.post("/stores", data);
export const storeStatus = (id, data) => API.put(`/stores/${id}/toggle`, data);
export const addStore = (data) => API.post("/stores", data);
export const editStoreById = (id, data) =>
  API.put(`/stores/editStoreById/${id}`, data);

// ── Items ────────────────────────────────────────────────────
export const getItems = (params) => API.get("/items", { params });
export const getItemById = (id) => API.get(`/items/${id}`);
export const createItem = (data) => API.post("/items", data);
export const updateItem = (id, data) => API.patch(`/items/${id}`, data);
export const deleteItem = (id) => API.delete(`/items/${id}`);

// ── Requests ─────────────────────────────────────────────────
export const getRequests = (params) => API.get("/requests", { params });
export const getRequestById = (id) => API.get(`/requests/${id}`);
export const getItemSummary = (params) =>
  API.get("/requests/item-summary", { params });
export const createRequest = (data) => API.post("/requests", data);
export const submitGRN = (id, data) => API.patch(`/requests/${id}/grn`, data);
export const acceptReturn = (id, data) =>
  API.patch(`/requests/${id}/accept-return`, data);
export const resendItems = (id, data) =>
  API.patch(`/requests/${id}/resend`, data);
export const approveRequest = (id, data) =>
  API.patch(`/requests/${id}/approve`, data);
export const rejectRequest = (id, data) =>
  API.patch(`/requests/${id}/reject`, data);
export const fulfillRequest = (id) => API.patch(`/requests/${id}/fulfill`, {});
export const headOfficeFulfillRequest = (id, data) =>
  API.patch(`/requests/${id}/fulfill`, data);

// ── Users ────────────────────────────────────────────────

export const login = (credentials) => API.post("/users/login", credentials);

export const refreshToken = () => API.post("/users/refresh");

export const logout = () => API.post("/users/logout");

export const addUser = (credentials) => API.post("/users/addUser", credentials);

export const getUsers = (params) => API.get("/users/getUsers", { params });

export const userStatus = (data) => API.put("/users/action", data);

export const getUserById = (id) => API.get(`/users/getUserById/${id}`);

export const editUserById = (id, data) =>
  API.put(`/users/editUserById/${id}`, data);

// ── Main Store ────────────────────────────────────────────────

export const getStoreManager = (params) =>
  API.get("/users/getManager", { params });

export const reusableItems = (params) => API.get("/items", { params });

export default API;
