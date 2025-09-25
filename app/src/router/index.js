import Vue from "vue";
import VueRouter from "vue-router";
import Home from "../views/Home.vue";
import CreateEvent from "../views/CreateEvent/index.vue";
import DetailEvent from "../views/DetailEvent/index.vue";
import DetailsEventId from "../views/DetailEvent/Details/detail-event.vue";
import SprintRace from "../views/DetailEvent/RaceCategory/SprintRace.vue";
import SlalomRace from "../views/DetailEvent/RaceCategory/SlalomRace.vue";
import DownRiverRace from "../views/DetailEvent/RaceCategory/DownRiverRace.vue";
import Head2Head from "../views/DetailEvent/RaceCategory/HeadToHead.vue";
import CreateTeam from "@/views/CreateTeam/index.vue";
import SprintResult from "@/views/Result/SprintResult.vue";
import HeadToHeadResult from "@/views/Result/HeadToHeadResult.vue";
import SlalomResult from "@/views/Result/SlalomResult.vue";
import DrrResult from "@/views/Result/DrrResult.vue";
import OverallResult from "@/views/Result/OverallResult.vue";
import AdminUserManagement from "../views/Users/AdminUserManagement.vue";
import AllEvent from "../views/Event/AllEvent.vue";

Vue.use(VueRouter);

const routes = [
  { path: "/", name: "home", component: Home },

  {
    path: "/admin/users",
    name: "AdminUserManagement",
    component: AdminUserManagement,
  },

  { path: "/events", name: "events", component: AllEvent },

  { path: "/create-new", name: "create-new", component: CreateEvent },

  { path: "/team-create", name: "create-team", component: CreateTeam },

  // optional: route mandiri ke slalom (bukan bagian dari detail event)
  { path: "/slalom-race", name: "slalom-race-page", component: SlalomRace },

  {
    path: "/event-detail/:id",
    name: "event",
    component: DetailEvent,
    props: true, // teruskan :id ke DetailEvent
    children: [
      {
        // default child -> JANGAN pakai "/"
        path: "",
        name: "detail-event",
        component: DetailsEventId,
        props: true, // :id tetap diteruskan
      },
      {
        path: "sprint-race",
        name: "sprint-race",
        component: SprintRace,
        props: true,
      },
      {
        path: "slalom-race",
        name: "slalom-race",
        component: SlalomRace,
        props: true,
      },
      {
        path: "drr-race",
        name: "drr-race",
        component: DownRiverRace,
        props: true,
      },
      {
        path: "head2head-race",
        name: "head2head-race",
        component: Head2Head,
        props: true,
      },

      {
        path: "sprint-result",
        name: "SprintResult",
        component: SprintResult,
        props: true,
      },
      {
        path: "slalom-result",
        name: "SlalomResult",
        component: SlalomResult,
        props: true,
      },
      {
        path: "drr-result",
        name: "DrrResult",
        component: DrrResult,
        props: true,
      },
      {
        path: "headtohead-result",
        name: "HeadToHeadResult",
        component: HeadToHeadResult,
        props: true,
      },
      {
        path: "overall-result",
        name: "OverallResult",
        component: OverallResult,
        props: true,
      },
    ],
  },

  // 404 harus paling terakhir
  { path: "*", component: () => import("@/views/_errors/NotFound.vue") },
];

const router = new VueRouter({
  // mode: "history", // aktifkan kalau server kamu sudah siap handle SPA
  routes,
  scrollBehavior() {
    return { x: 0, y: 0 };
  },
});

export default router;
