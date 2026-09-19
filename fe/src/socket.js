import { io } from "socket.io-client";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Shared singleton so every page reuses the same connection.
export const socket = io(BACKEND_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"],
});
