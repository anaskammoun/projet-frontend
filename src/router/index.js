import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../components/Dashboard.vue";
import CollectPoints from "../pages/CollectPoints.vue";
import Vehicles from "../pages/Vehicles.vue";
import Employees from "../pages/Employees.vue";
import Tours from "../pages/Tours.vue";
import Login from "../pages/Login.vue";

const routes = [
  // redirect root to dashboard for clarity
  { path: "/", redirect: "/dashboard" },
  { path: "/dashboard", component: Dashboard },

  // Collect points - english and french aliases
  { path: "/collect-points", component: CollectPoints },
  { path: "/points", component: CollectPoints },

  // Vehicles
  { path: "/vehicles", component: Vehicles },
  { path: "/vehicules", component: Vehicles },

  // Employees
  { path: "/employees", component: Employees },
  { path: "/employes", component: Employees },

  // Tours
  { path: "/tours", component: Tours },
  { path: "/tournees", component: Tours },

  // Auth
  { path: "/login", component: Login },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
