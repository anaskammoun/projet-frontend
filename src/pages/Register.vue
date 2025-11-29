<template>
	<AuthLayout>
		<h3 class="mb-3">Créer un compte</h3>
		<form @submit.prevent="submit">
			<div class="mb-3">
				<label class="form-label">Nom</label>
				<input v-model="form.nom" class="form-control" required />
			</div>
			<div class="mb-3">
				<label class="form-label">Email</label>
				<input v-model="form.email" type="email" class="form-control" required />
			</div>
			<div class="mb-3">
				<label class="form-label">Mot de passe</label>
				<input v-model="form.password" type="password" class="form-control" required />
			</div>
			<button class="btn btn-success" type="submit">S'inscrire</button>
		</form>
	</AuthLayout>
</template>

<script setup>
import AuthLayout from '../layouts/AuthLayout.vue'
import { reactive } from 'vue'

const form = reactive({ nom: '', email: '', password: '' })

function submit() {
	// placeholder — should call registration endpoint
	alert('Inscription simulée — implémenter l\'API')
}
</script>
