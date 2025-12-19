import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../components/Dashboard.vue";
import CollectPoints from "../pages/CollectPoints.vue";
import Vehicles from "../pages/Vehicles.vue";
import Employees from "../pages/Employees.vue";
import Tours from "../pages/Tours.vue";
import Employe from "../pages/Employe.vue";
import Citoyen from "../pages/Citoyen.vue";
import Logout from "../pages/Logout.vue";
// Authentication removed; routes are now public.

const routes = [
  // redirect root to dashboard for clarity
  { path: "/", redirect: "/citoyen" },
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

  // Role spaces
  { path: "/employe", component: Employe },
  { path: "/employé", component: Employe },
  { path: "/citoyen", component: Citoyen },
  { path: "/logout", component: Logout },
  // Auth routes removed
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// No auth guard; all routes are public now
router.beforeEach((to, from, next) => next());

export default router;
