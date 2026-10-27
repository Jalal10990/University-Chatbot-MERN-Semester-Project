const rawBase = import.meta.env.VITE_API_BASE_URL ?? "";

export const API_BASE_URL = rawBase.replace(/\/+$/, ""); // remove trailing slashes
export const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_ENDPOINT ?? "/api/chat";
export const USE_DEMO = import.meta.env.VITE_USE_DEMO !== "false"; // demo unless "false"