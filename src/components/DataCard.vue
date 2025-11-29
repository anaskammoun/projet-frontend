<template>
	<div class="card h-100">
		<div class="card-body">
			<h6 class="card-subtitle mb-2 text-muted">{{ title }}</h6>
			<h3 class="card-title">{{ value }}</h3>
		</div>
	</div>
</template>

<script setup>
defineProps({
	title: { type: String, default: '' },
	value: { type: [String, Number], default: '—' }
})
</script>

<style scoped>
.card { min-height: 140px; }
.card .card-title { font-size: 1.6rem; }
.card .card-subtitle { font-size: 0.95rem; }
</style>
