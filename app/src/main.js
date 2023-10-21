import Vue from 'vue'
import App from './App.vue'
import router from './router';


import { Icon } from '@iconify/vue2';


Vue.component('Icon', Icon); 


import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

import BootstrapVue from 'bootstrap-vue'

Vue.use(BootstrapVue)
Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
