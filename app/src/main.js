import Vue from 'vue'
import App from './App.vue'
import router from './router';

import { Icon } from '@iconify/vue2';

import 'regenerator-runtime/runtime'

Vue.component('Icon', Icon); 


import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import '@/assets/styles/admin-pages.css'
import '@/assets/styles/race-category-stickybar.css'
import '@/assets/styles/race-category-toolbar.css'
import '@/assets/styles/list-pages.css'
import '@/assets/styles/judge-history-modal.css'
import '@/assets/styles/result-pages.css'

import BootstrapVue from 'bootstrap-vue'


Vue.use(BootstrapVue)
// Widget mengambang transparan, jelas saat cursor mendekat (lihat utils/proximityFade.js)
import proximityFade from '@/utils/proximityFade'
Vue.directive('proximity-fade', proximityFade)
// Switch Category berupa tombol (pengganti dropdown) di 5 halaman Race Category
import BucketButtonGroup from '@/components/race/BucketButtonGroup.vue'
Vue.component('BucketButtonGroup', BucketButtonGroup)
// Indikator koneksi database + perubahan menunggu (services/dbHealth.js)
import DbStatusBadge from '@/components/common/DbStatusBadge.vue'
Vue.component('DbStatusBadge', DbStatusBadge)
Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
