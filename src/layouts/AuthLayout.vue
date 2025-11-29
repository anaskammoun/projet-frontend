<template>
	<div class="d-flex align-items-center justify-content-center min-vh-100">
		<div class="card p-4" style="max-width:420px; width:100%">
			<slot />
		</div>
	</div>
</template>

<script setup>
</script>

<style scoped>
.min-vh-100 { min-height: 100vh; }
</style>
