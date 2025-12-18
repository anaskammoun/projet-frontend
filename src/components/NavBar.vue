<template>
  <div>
    <!-- Navbar fixe -->
    <nav class="navbar navbar-light bg-white shadow-sm px-3 fixed-top" style="left: 320px; width: calc(100% - 320px); z-index: 1020;">
      <div class="d-flex flex-column">
        <span class="navbar-brand mb-0 h1">Gestion Déchets Urbains</span>
        <small class="text-muted" v-if="role">Rôle: {{ roleLabel }}</small>
      </div>
      <div style="margin-left:auto; display:flex; align-items:center; gap:12px;">
        <NotificationBell />
        <button @click="logout" class="btn btn-outline-danger btn-sm">
          <i class="bi bi-box-arrow-right"></i> Déconnexion
        </button>
      </div>
    </nav>

    <!-- Contenu principal -->
    <div class="main-content" style="margin-left: 320px; padding-top: 35px;">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import NotificationBell from './NotificationBell.vue'
import authService from '../services/auth.service.js'
import { useRouter } from 'vue-router'

const router = useRouter()
const role = computed(() => authService.getRole())
const roleLabel = computed(() => {
  switch ((role.value || '').toUpperCase()) {
    case 'ADMIN': return 'Admin'
    case 'EMPLOYE': return 'Employé'
    case 'CITOYEN': return 'Citoyen'
    default: return role.value
  }
})

function logout() {
  authService.logout()
  router.push('/login')
}
</script>

<style scoped>
body {
  padding-top: 56px; /* Ajustez si votre navbar est plus grand */
}
</style>