<template>
	<footer class="text-center text-muted py-3">
		<small>© {{ year }} — Gestion Déchets Urbains</small>
	</footer>
</template>

<script setup>
import { ref } from 'vue'
const year = new Date().getFullYear()
</script>

<style scoped>
footer { background: transparent; }
</style>
