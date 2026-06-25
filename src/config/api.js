const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";

const stripTrailingSlash = (value) => value.replace(/\/+$/, "");

export const API_BASE_URL = stripTrailingSlash(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
);

export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/v1$/, "");
