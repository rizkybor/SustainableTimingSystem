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

import BootstrapVue from 'bootstrap-vue'


Vue.use(BootstrapVue)
Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
