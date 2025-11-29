<template>
  <div>
    <!-- Sidebar -->
   =

    <!-- Navbar fixe -->
    <nav class="navbar navbar-light bg-white shadow-sm px-3 fixed-top" style="left: 320px; width: calc(100% - 320px); z-index: 1020;">
      <span class="navbar-brand mb-0 h1">Gestion Déchets Urbains</span>
      <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
        <NotificationBell />
      </div>
    </nav>

    <!-- Contenu principal -->
    <div class="main-content" style="margin-left: 320px; padding-top: 35px;">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import NotificationBell from './NotificationBell.vue'
</script>

<style scoped>
body {
  padding-top: 56px; /* Ajustez si votre navbar est plus grand */
}
</style>