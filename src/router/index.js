import { createRouter, createWebHistory } from "vue-router";
import Dashboard from "../components/Dashboard.vue";
import CollectPoints from "../pages/CollectPoints.vue";
import Vehicles from "../pages/Vehicles.vue";
import Employees from "../pages/Employees.vue";
import Tours from "../pages/Tours.vue";
import Login from "../pages/Login.vue";
import Register from "../pages/Register.vue";
import authService from "../services/auth.service.js";

const routes = [
  // redirect root to dashboard for clarity
  { path: "/", redirect: "/dashboard" },
  { path: "/dashboard", component: Dashboard, meta: { requiresAuth: true } },

  // Collect points - english and french aliases
  { path: "/collect-points", component: CollectPoints, meta: { requiresAuth: true } },
  { path: "/points", component: CollectPoints, meta: { requiresAuth: true } },

  // Vehicles
  { path: "/vehicles", component: Vehicles, meta: { requiresAuth: true } },
  { path: "/vehicules", component: Vehicles, meta: { requiresAuth: true } },

  // Employees
  { path: "/employees", component: Employees, meta: { requiresAuth: true } },
  { path: "/employes", component: Employees, meta: { requiresAuth: true } },

  // Tours
  { path: "/tours", component: Tours, meta: { requiresAuth: true } },
  { path: "/tournees", component: Tours, meta: { requiresAuth: true } },

  // Auth
  { path: "/login", component: Login },
  { path: "/register", component: Register },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard to check authentication
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !authService.isAuthenticated()) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && authService.isAuthenticated()) {
    next('/dashboard');
  } else {
    next();
  }
});

export default router;
