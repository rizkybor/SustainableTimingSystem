import { io } from "socket.io-client";
import { log } from "@/utils/logger";

const BROKER_URL =
  process.env.VUE_APP_MODE === "lan"
    ? process.env.VUE_APP_RT_URL_LAN
    : process.env.VUE_APP_RT_URL;

const TOKEN =
  typeof window !== "undefined" ? localStorage.getItem("authToken") : undefined;

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(BROKER_URL, { auth: { token: TOKEN } });
    socket.on("connect", () => {
      if (process.env.VUE_APP_ENV !== "production") {
        log.info("[Electron] socket connected:", socket.id);
      }
    });

    socket.on("disconnect", () => {
      if (process.env.VUE_APP_ENV !== "production") {
        log.info("[Electron] socket disconnected");
      }
    });
  }
  return socket;
}
