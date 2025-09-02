import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import CreateEvent from "../views/CreateEvent/index.vue";
import DetailEvent from "../views/DetailEvent/index.vue";
import DetailsEventId from "../views/DetailEvent/Details/detail-event.vue"
import SprintRace from "../views/DetailEvent/RaceCategory/SprintRace.vue";
import SlalomRace from "../views/DetailEvent/RaceCategory/SlalomRace.vue";
import DownRiverRace from "../views/DetailEvent/RaceCategory/DownRiverRace.vue";
import Head2Head from "../views/DetailEvent/RaceCategory/HeadToHead.vue";
import CreateTeam from "@/views/CreateTeam/index.vue";


Vue.use(VueRouter);

const routes = [
  { path: "/", name: "home", component: Home },
  { path: "/create-new", component: CreateEvent },
    { path: "/team-create", name: "create-team", component: CreateTeam },
  { path: "/slalom-race", component: SlalomRace },
  {
    path: "/event-detail/:id",
    name: "event",
    component: DetailEvent,
    children: [
      {
        path: "/",
        name: "detail-event",
        component: DetailsEventId,
      },
      {
        path: "sprint-race",
        name: "sprint-race",
        component: SprintRace,
      },
      {
        path: "slalom-race",
        name: "slalom-race",
        component: SlalomRace,
      },
      {
        path: "drr-race",
        name: "drr-race",
        component: DownRiverRace,
      },
      {
        path: "head2head-race",
        name: "head2head-race",
        component: Head2Head,
      },
    ],
  },
];

const router = new VueRouter({
  routes,
});

export default router;
