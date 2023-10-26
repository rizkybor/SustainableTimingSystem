import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import CreateEvent from "../views/CreateEvent.vue";
import SprintRace from "../views/RaceCategory/SprintRace.vue"
import SlalomRace from "../views/RaceCategory/SlalomRace.vue"

Vue.use(VueRouter);

const routes = [
  { path: "/", component: Home },
  { path: "/create-new", component: CreateEvent },
  { path: "/sprint-race", component: SprintRace },
  { path: "/slalom-race", component: SlalomRace },


];

const router = new VueRouter({
  routes,
});

export default router;
