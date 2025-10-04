import axios from 'axios';

export async function createApi() {
  // ambil pilihan endpoint saat ini
  const { apiBase } = await window.netcfg.get();
  const instance = axios.create({
    baseURL: apiBase,
    timeout: 8000,
  });
  // interceptor dsb di sini…
  return instance;
}