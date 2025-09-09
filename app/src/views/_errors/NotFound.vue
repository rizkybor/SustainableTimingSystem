<template>
  <div class="empty-full">
    <img v-if="imgSrc" :src="imgSrc" alt="404 Not Found" class="empty-illustration" />
    <h2 class="empty-title">404 – Page Not Found</h2>
    <p class="empty-subtitle">Halaman yang Anda cari tidak ditemukan.</p>
    <div class="empty-actions">
      <b-button variant="primary" class="px-4 py-2" @click="goHome">Kembali ke Dashboard</b-button>
    </div>
  </div>
</template>

<script>
export default {
  name: "NotFound",
  props: {
    imgSrc: { type: String, default: "" }, // contoh: require('@/assets/404-raft.png')
  },
  methods:{
    goHome(){ this.$router.push({ path: "/" }); }
  }
};
</script>

<style scoped>
.empty-full{
  min-height: 100vh; display:flex; align-items:center; justify-content:center;
  flex-direction:column; text-align:center; padding:20px;
}
.empty-illustration{ width: min(640px, 86vw); height:auto; margin-bottom:18px; }
.empty-title{ font-weight:800; font-size:28px; color:#3b3f4a; margin-bottom:8px; }
.empty-subtitle{ color:#7a808c; margin-bottom:16px; }
.empty-actions{ margin-top:6px; }
</style>