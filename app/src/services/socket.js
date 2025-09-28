import { io } from "socket.io-client";

const BROKER_URL = process.env.VUE_APP_RT_URL || "http://localhost:4000";

const TOKEN =
  typeof window !== "undefined" ? localStorage.getItem("authToken") : undefined;

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(BROKER_URL, { auth: { token: TOKEN } });
    socket.on("connect", () => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[Electron] socket connected:", socket.id);
      }
    });

    socket.on("disconnect", () => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[Electron] socket disconnected");
      }
    });
  }
  return socket;
}
