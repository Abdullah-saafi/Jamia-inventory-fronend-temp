import axios from "axios";

const API = axios.create({
  baseURL: 
  // import.meta.env.VITE_API_URL || 
  "http://localhost:5500/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let memoryToken = "";
let isRefreshing = false;
let refreshSubscribers = [];

export const setAccessTokenInApi = (token) => {
  memoryToken = token;

  if (token) {
    localStorage.setItem("accessToken", token);
  } else {
    localStorage.removeItem("accessToken");
  }
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

    const isAuthRoute =
  originalRequest.url.includes("/users/refresh") ||
  originalRequest.url.includes("/users/login");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRoute
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
export const rejectItemById = (id,rid) => API.delete(`/requests/${id}/item/${rid}`);
export const getItemHistory = (store_id, item_no) => API.get(`/items/store/${store_id}/item/${item_no}`);
export const getItemCategories = (store_id) =>
  API.get("/categories/availableItemCategory", {
    params: { store_id },
  });

// ── Requests ─────────────────────────────────────────────────
export const getRequests = (params) => API.get("/requests", { params });
export const getRequestById = (id) => API.get(`/requests/${id}`);
export const getItemSummary = (params) =>
  API.get("/requests/item-summary", { params });
export const createRequest = (data) => API.post("/requests", data,);
export const submitGRN = (id, data) => API.patch(`/requests/${id}/grn`, data);
export const acceptReturn = (id, data) =>
  API.patch(`/requests/${id}/accept-return`, data);
export const resendItems = (id, data) =>
  API.patch(`/requests/${id}/resend`, data);
export const approveRequest = (id, data) =>
  API.patch(`/requests/${id}/approve`, data);
export const rejectRequest = (id, data) =>
  API.patch(`/requests/${id}/reject`, data);
export const fulfillRequest = (id,data) => API.patch(`/requests/${id}/fulfill`, data);
export const sendReturnToMain = (id, data) =>
  API.patch(`/requests/${id}/send-back`, data);
export const acceptReturnFromSub = (id, accepted_by_name) =>
  API.patch(`/requests/${id}/close-reusable`, { accepted_by_name });
export const resolveDispute = (id, data) =>
  API.patch(`/requests/${id}/resolve-dispute`, data);
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

// ── Random Number ────────────────────────────────────────────────

export const generateRandomNumber = (params) =>
  API.get("/items/randomNumber", { params });

export const reusableItems = (params) => API.get("/items", { params });

export const getCategories = () => API.get("/categories");
export const createCategory = (data) => API.post("/categories", data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// ── UOM ────────────────────────────────────────────────

export const getUOM = () => API.get("/baseunits");
export const addUOM = () => API.post("/baseunits");

// ── Scrap ────────────────────────────────────────────────
export const scrapByMain = (data) => API.patch("/requests/scrapMain", data);
export const sendScrapToMain = (id, data) =>
  API.patch(`/requests/${id}/scrapSub`, data);

// scarp and new table api
export const getReturnRequests = (params) => API.get("/returns", { params });
export const getReturnRequestById = (id) => API.get(`/returns/${id}`);
export const processReturnRequest = (id, data) =>
  API.patch(`/returns/${id}/process`, data);
export const createReturnRequest = (data) => API.post("/returns", data);
export default API;
