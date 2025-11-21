<template>
	<div class="d-flex layout-root">
		<SideBar />

		<div class="content flex-grow-1 d-flex flex-column bg-light">
			<NavBar />

			<main class="flex-grow-1 overflow-auto p-4">
				<slot />
			</main>

			<Footer />
		</div>
	</div>
</template>

<script setup>
import SideBar from '../components/SideBar.vue'
import NavBar from '../components/NavBar.vue'
import Footer from '../components/Footer.vue'
</script>

<style scoped>
.layout-root { min-height: 100vh; }
.content { min-height: 100vh; display: flex; flex-direction: column; }
.overflow-auto { overflow: auto; }
</style>
