<template>
  <div class="d-flex">
    <Sidebar />

    <div class="flex-grow-1">
      <Navbar />
      <div class="p-4">
        <slot />
      </div>
      <Footer />
    </div>
  </div>
</template>

<script setup>
import Sidebar from "../components/Sidebar.vue"
import Navbar from "../components/Navbar.vue"
import Footer from "../components/Footer.vue"
</script>
