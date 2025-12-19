<template>
  <div class="d-flex flex-column layout-root">
    <main class="flex-grow-1 overflow-auto p-4">
      <slot />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Footer from '../components/Footer.vue'
</script>

<style scoped>
.layout-root {
  min-height: 100vh;
  background: #f5f5f5;
}

.overflow-auto {
  overflow: auto;
}

main {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
