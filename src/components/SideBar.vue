<template>
  <div class="bg-dark text-white p-3 vh-100 sidebar-desktop" style="width: 320px;">
    <h4 class="mb-4">Menu</h4>

    <ul class="nav flex-column gap-2">
      <li><router-link to="/dashboard" class="nav-link text-white"><i class="bi bi-speedometer2"></i> Dashboard</router-link></li>
      <li><router-link to="/points" class="nav-link text-white"><i class="bi bi-trash"></i> Points collecte</router-link></li>
      <li><router-link to="/employes" class="nav-link text-white"><i class="bi bi-people"></i> Employés</router-link></li>
      <li><router-link to="/vehicules" class="nav-link text-white"><i class="bi bi-truck"></i> Véhicules</router-link></li>
      <li><router-link to="/tournees" class="nav-link text-white"><i class="bi bi-route"></i> Tournées</router-link></li>
    </ul>
  </div>
</template>

<style scoped>
.sidebar-desktop { min-width: 320px; }
.sidebar-desktop .nav-link { font-size: 1.05rem; }
</style>
