// src/services/socket.js
import { io } from 'socket.io-client';

// fallback ke env variable biasa, kalau tidak ada pakai default
const BROKER_URL = process.env.VITE_RT_URL || 'http://localhost:4000';
// Kalau perlu auth: simpan token ke localStorage('authToken') dan kirim di auth
const TOKEN = typeof window !== 'undefined' ? localStorage.getItem('authToken') : undefined;

let socket;

export function getSocket() {
  if (!socket) {
    socket = io(BROKER_URL, { auth: { token: TOKEN } });
    socket.on('connect', () => console.log('[Electron] socket connected:', socket.id));
    socket.on('disconnect', () => console.log('[Electron] socket disconnected'));
  }
  return socket;
}