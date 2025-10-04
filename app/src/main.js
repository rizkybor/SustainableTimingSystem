import Vue from 'vue'
import App from './App.vue'
import router from './router'

import { Icon } from '@iconify/vue2'
import 'regenerator-runtime/runtime'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import BootstrapVue from 'bootstrap-vue'
Vue.use(BootstrapVue)
Vue.component('Icon', Icon)
Vue.config.productionTip = false

// --- util kecil untuk join baseURL + path (tahan slash dobel) ---
function joinURL(base, path) {
  const b = base && base.endsWith('/') ? base.slice(0, -1) : base
  const p = path && path.startsWith('/') ? path : `/${path}`
  return b + p
}

;(async function boot() {
  // 1) Ambil konfigurasi jaringan dari IPC (Electron) → fallback ke env/dev
  let apiBase, realtime

  if (typeof window !== 'undefined' && window.netcfg && typeof window.netcfg.get === 'function') {
    try {
      const pick = await window.netcfg.get() // { apiBase, realtime, mode, config }
      apiBase = pick && pick.apiBase
      realtime = (pick && pick.realtime) || null
    } catch (e) {
      console.warn('[BOOT] netcfg.get() gagal, fallback ke env:', (e && e.message) || e)
    }
  }

  if (!apiBase) {
    apiBase = process.env.VUE_APP_API_BASE || 'http://localhost:3000'
  }
  if (!realtime) {
    realtime = process.env.VUE_APP_REALTIME || null
  }

  // 2) HTTP helper berbasis fetch
  let currentBase = apiBase
  async function http(path, opts = {}) {
    const url = joinURL(currentBase, path)
    const init = {
      headers: Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {}),
      method: opts.method || 'GET',
      body: opts.body,
      credentials: opts.credentials,
      mode: opts.mode,
      cache: opts.cache,
      redirect: opts.redirect,
      referrerPolicy: opts.referrerPolicy,
      signal: opts.signal
    }
    const res = await fetch(url, init)
    if (!res.ok) {
      let text = ''
      try { text = await res.text() } catch (_) {}
      throw new Error('[HTTP ' + res.status + '] ' + url + ' -> ' + (text || res.statusText))
    }
    const ct = res.headers.get('content-type') || ''
    return ct.indexOf('application/json') !== -1 ? res.json() : res.text()
  }

  // 3) (Opsional) WebSocket helper
  let ws = null
  function connectWS(url) {
    if (!url) return null
    try {
      const socket = new WebSocket(url)
      socket.addEventListener('open', function () { console.log('[WS] open', url) })
      socket.addEventListener('close', function () { console.log('[WS] close') })
      socket.addEventListener('error', function (e) {
        console.warn('[WS] error', (e && e.message) || e)
      })
      return socket
    } catch (e) {
      console.warn('[WS] gagal konek:', (e && e.message) || e)
      return null
    }
  }
  if (realtime) ws = connectWS(realtime)

  // 4) Injeksi ke Vue global
  Vue.prototype.$apiBase = currentBase
  Vue.prototype.$http = http
  Vue.prototype.$ws = ws

  // 5) Fungsi ganti jaringan saat runtime (LAN/Online/Auto)
  Vue.prototype.$setNetworkMode = async function (mode /* 'lan'|'online'|'auto' */) {
    if (!(typeof window !== 'undefined' && window.netcfg && typeof window.netcfg.set === 'function')) {
      console.warn('netcfg.set tidak tersedia di konteks ini')
      return { mode: mode, apiBase: currentBase }
    }
    const st = await window.netcfg.set({ mode: mode }) // { mode, apiBase, realtime, ... }
    currentBase = st.apiBase
    Vue.prototype.$apiBase = currentBase
    if (Vue.prototype.$ws) {
      try { Vue.prototype.$ws.close() } catch (_) {}
    }
    Vue.prototype.$ws = st.realtime ? connectWS(st.realtime) : null
    return st
  }

  // 6) Mount app
  new Vue({
    router,
    render: function (h) { return h(App) },
  }).$mount('#app')
})()