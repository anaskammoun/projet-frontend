<template>
	<AuthLayout>
		<h3 class="mb-3">Connexion</h3>
		<form @submit.prevent="submit">
			<div class="mb-3">
				<label class="form-label">Email</label>
				<input v-model="form.email" type="email" class="form-control" required />
			</div>
			<div class="mb-3">
				<label class="form-label">Mot de passe</label>
				<input v-model="form.password" type="password" class="form-control" required />
			</div>
			<button class="btn btn-primary" type="submit">Se connecter</button>
			<div class="mt-3 text-center">
				<router-link to="/register" class="text-primary">Pas encore de compte ? S'inscrire</router-link>
			</div>
		</form>
	</AuthLayout>
</template>

<script setup>
import AuthLayout from '../layouts/AuthLayout.vue'
import authService from '../services/auth.service.js'
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

const form = reactive({ email: '', password: '' })
const router = useRouter()

async function submit() {
	try {
		await authService.login(form)
		// redirect to home
		router.push('/')
	} catch (e) {
		const errorMsg = e.response?.data || 'Erreur de connexion'
		alert(errorMsg)
	}
}
</script>
