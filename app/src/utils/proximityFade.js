// src/utils/proximityFade.js
//
// Directive `v-proximity-fade` — widget mengambang (Live Chat, Assign Heat,
// Go to Heat, dst.) dibuat transparan supaya tidak menutupi tabel di
// belakangnya, lalu makin jelas begitu cursor MENDEKAT (bukan baru saat
// tepat di atasnya), dan penuh saat cursor sudah dekat / widget sedang
// fokus (keyboard).
//
// Pemakaian:
//   <div v-proximity-fade="{ active: true }">…</div>
//   value.active   : false = selalu jelas (mis. panel widget sedang terbuka)
//   value.distance : jarak (px) mulai memudar, default 140
//   value.opacity  : opacity saat jauh, default 0.3
//
// Satu listener mousemove bersama utk semua elemen (di-throttle pakai
// requestAnimationFrame), dilepas otomatis kalau elemen terakhir dibuang.

const DEFAULTS = { active: true, distance: 140, near: 28, opacity: 0.3 };
const tracked = new Set();
let pointer = null; // { x, y } | null (cursor di luar jendela)
let rafId = 0;

function optionsOf(el) {
  return el.__proximityFade || DEFAULTS;
}

function apply(el) {
  const o = optionsOf(el);
  let opacity = 1;
  if (o.active && !el.matches(":focus-within")) {
    if (!pointer) {
      opacity = o.opacity;
    } else {
      const r = el.getBoundingClientRect();
      const dx = Math.max(r.left - pointer.x, 0, pointer.x - r.right);
      const dy = Math.max(r.top - pointer.y, 0, pointer.y - r.bottom);
      const dist = Math.hypot(dx, dy);
      if (dist <= o.near) opacity = 1;
      else if (dist >= o.distance) opacity = o.opacity;
      else {
        const t = (dist - o.near) / (o.distance - o.near);
        opacity = 1 - t * (1 - o.opacity);
      }
    }
  }
  el.style.opacity = String(Math.round(opacity * 100) / 100);
}

function applyAll() {
  rafId = 0;
  tracked.forEach(apply);
}

function schedule() {
  if (!rafId) rafId = requestAnimationFrame(applyAll);
}

function onMove(e) {
  pointer = { x: e.clientX, y: e.clientY };
  schedule();
}

function onLeaveWindow(e) {
  if (!e.relatedTarget && !e.toElement) {
    pointer = null;
    schedule();
  }
}

function listen(on) {
  const fn = on ? "addEventListener" : "removeEventListener";
  document[fn]("mousemove", onMove, { passive: true });
  document[fn]("mouseout", onLeaveWindow);
  window[fn]("blur", onLeaveWindow);
  document[fn]("focusin", schedule);
  document[fn]("focusout", schedule);
}

function setOptions(el, value) {
  el.__proximityFade = { ...DEFAULTS, ...(value || {}) };
}

export default {
  bind(el, binding) {
    setOptions(el, binding.value);
    el.style.transition = "opacity 0.18s ease";
    el.style.willChange = "opacity";
    if (!tracked.size) listen(true);
    tracked.add(el);
    apply(el);
  },
  update(el, binding) {
    setOptions(el, binding.value);
    apply(el);
  },
  unbind(el) {
    tracked.delete(el);
    el.style.opacity = "";
    el.style.transition = "";
    el.style.willChange = "";
    delete el.__proximityFade;
    if (!tracked.size) {
      listen(false);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }
  },
};
