<template>
  <div class="sidebar-desktop d-flex flex-column">
    <div class="sidebar-header mb-4 text-center">
      <h3 class="text-white fw-bold">Gestion Déchets</h3>
      <p class="text-secondary mb-0" v-if="role">Profil: {{ roleLabel }}</p>
    </div>

    <ul class="nav flex-column gap-2">
      <li>
        <router-link to="/dashboard" class="nav-link d-flex align-items-center" :class="{ active: $route.path === '/dashboard' }">
          <i class="bi bi-speedometer2 me-2"></i>
          <span>Dashboard</span>
        </router-link>
      </li>
      <li>
        <router-link to="/points" class="nav-link d-flex align-items-center" :class="{ active: $route.path === '/points' }">
          <i class="bi bi-trash me-2"></i>
          <span>Points collecte</span>
        </router-link>
      </li>
      <li v-if="isStaff">
        <router-link to="/employes" class="nav-link d-flex align-items-center" :class="{ active: $route.path === '/employes' }">
          <i class="bi bi-people me-2"></i>
          <span>Employés</span>
        </router-link>
      </li>
      <li v-if="isStaff">
        <router-link to="/vehicules" class="nav-link d-flex align-items-center" :class="{ active: $route.path === '/vehicules' }">
          <i class="bi bi-truck me-2"></i>
          <span>Véhicules</span>
        </router-link>
      </li>
      <li v-if="isStaff">
        <router-link to="/tournees" class="nav-link d-flex align-items-center" :class="{ active: $route.path === '/tournees' }">
          <i class="bi bi-route me-2"></i>
          <span>Tournées</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import authService from '../services/auth.service.js'

const role = computed(() => authService.getRole())
const isStaff = computed(() => authService.hasRole('ADMIN', 'EMPLOYE'))
const roleLabel = computed(() => {
  switch ((role.value || '').toUpperCase()) {
    case 'ADMIN': return 'Admin'
    case 'EMPLOYE': return 'Employé'
    case 'CITOYEN': return 'Citoyen'
    default: return role.value
  }
})
</script>

<style scoped>
.sidebar-desktop {
  width: 320px;
  min-width: 320px;

  position: fixed;
  top: 0;
  left: 0;

  height: 100vh;
  overflow-y: auto;
  z-index: 1000;

  background: #1c1c1e; /* Darker professional look */
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
}

/* Header style */
.sidebar-header h3 {
  font-size: 1.5rem;
  letter-spacing: 1px;
}

/* Nav links */
.sidebar-desktop .nav-link {
  font-size: 1.05rem;
  color: #ccc;
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.sidebar-desktop .nav-link i {
  font-size: 1.2rem;
}

/* Hover effect */
.sidebar-desktop .nav-link:hover {
  background: #343a40;
  color: #fff;
}

/* Active link */
.sidebar-desktop .nav-link.active {
  background: #0d6efd;
  color: #fff;
}
</style>
