<template>
  <span class="cf-icon" :style="boxStyle" aria-hidden="true">
    <img :src="src" alt="" draggable="false" />
  </span>
</template>

<script>
// Ikon modul Orienteering = bendera kontrol (oranye/putih) dari
// assets/images/orienteering-control-flag.jpg. File JPG punya margin putih
// ~12.5% tiap sisi -> di-crop lewat scale di dalam wadah overflow:hidden
// supaya tidak muncul kotak putih di atas latar berwarna. Sama pola dgn
// ControlFlagIcon di sts-jurysystem.
import controlFlagImg from "@/assets/images/orienteering-control-flag.jpg";

export default {
  name: "ControlFlagIcon",
  props: {
    // ukuran sisi (px atau string CSS)
    size: { type: [Number, String], default: 24 },
  },
  data() {
    return { src: controlFlagImg };
  },
  computed: {
    boxStyle() {
      const s = typeof this.size === "number" ? `${this.size}px` : this.size;
      return { width: s, height: s };
    },
  },
};
</script>

<style scoped>
.cf-icon {
  position: relative;
  display: inline-block;
  flex: none;
  overflow: hidden;
  border-radius: 18%;
}
.cf-icon img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scale(1.34);
}
</style>
