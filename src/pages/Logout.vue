<template>
  <div class="d-flex align-items-center justify-content-center" style="min-height: 60vh;">
    <div class="text-center">
      <div class="spinner-border text-primary mb-3" role="status"></div>
      <p>Déconnexion en cours...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import authService from '../services/auth.service.js'

onMounted(() => {
  authService.logout() // supprime le token côté backend

  setTimeout(() => {
    window.location.href = '/logout' // redirige vers Nginx logout
  }, 1500)
})
</script>
