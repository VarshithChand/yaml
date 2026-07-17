// Empty by default so every client's baseURL stays a plain "/api/..." path —
// that works as-is for local dev (Vite's proxy) and the Docker/nginx setup
// (nginx reverse-proxies /api to the backend container). Set
// VITE_API_BASE_URL at build time when frontend and backend are on
// different origins (e.g. a static host + a separately hosted API), so
// requests go to an absolute URL instead.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
