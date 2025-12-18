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

  // Collect points - english and french aliases (accessible to all authenticated roles)
  { path: "/collect-points", component: CollectPoints, meta: { requiresAuth: true } },
  { path: "/points", component: CollectPoints, meta: { requiresAuth: true } },

  // Vehicles - only admin or employe can gérer
  { path: "/vehicles", component: Vehicles, meta: { requiresAuth: true, roles: ["ADMIN", "EMPLOYE"] } },
  { path: "/vehicules", component: Vehicles, meta: { requiresAuth: true, roles: ["ADMIN", "EMPLOYE"] } },

  // Employees - only admin or employe
  { path: "/employees", component: Employees, meta: { requiresAuth: true, roles: ["ADMIN", "EMPLOYE"] } },
  { path: "/employes", component: Employees, meta: { requiresAuth: true, roles: ["ADMIN", "EMPLOYE"] } },

  // Tours - only admin or employe
  { path: "/tours", component: Tours, meta: { requiresAuth: true, roles: ["ADMIN", "EMPLOYE"] } },
  { path: "/tournees", component: Tours, meta: { requiresAuth: true, roles: ["ADMIN", "EMPLOYE"] } },

  // Auth
  { path: "/login", component: Login },
  { path: "/register", component: Register },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard to check authentication + roles
router.beforeEach((to, from, next) => {
  const isAuth = authService.isAuthenticated()

  if (to.meta.requiresAuth && !isAuth) {
    return next('/login')
  }

  if (isAuth && (to.path === '/login' || to.path === '/register')) {
    return next('/dashboard')
  }

  if (to.meta.roles && to.meta.roles.length) {
    if (!authService.hasRole(...to.meta.roles)) {
      // fallback to dashboard if role not allowed
      return next('/dashboard')
    }
  }

  return next()
});

export default router;
