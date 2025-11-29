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
.layout-root {
	min-height: 100vh;
}

/* Pushes content to the right so it doesn't go under the fixed sidebar */
.content {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	margin-left: 320px; /* Same width as your sidebar */
}

/* Allows scrolling inside the main area */
.overflow-auto {
	overflow: auto;
}
</style>
	