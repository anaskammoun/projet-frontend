<template>
	<DashboardLayout>
		<div class="d-flex justify-content-between align-items-center mb-3">
			<h2>Employés</h2>
			<button class="btn btn-primary" @click="openAdd">Ajouter</button>
		</div>

		<table class="table table-striped">
			<thead>
				<tr>
					<th>Nom</th>
					<th>Rôle</th>
					<th>Compétences</th>
					<th>Disponible</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="e in employees" :key="e.id">
					<td>{{ e.name }}</td>
					<td>{{ e.role }}</td>
					<td>{{ (e.skills || []).join(', ') }}</td>
					<td>{{ e.available ? 'Oui' : 'Non' }}</td>
					<td>
						<button class="btn btn-sm btn-warning me-1" @click="openEdit(e)">Modifier</button>
						<button class="btn btn-sm btn-danger" @click="remove(e.id)">Supprimer</button>
					</td>
				</tr>
			</tbody>
		</table>

		<div v-if="showForm" class="card mt-4 p-3">
			<h5>{{ editingId ? 'Modifier employé' : 'Ajouter employé' }}</h5>
			<form @submit.prevent="save">
				<div class="mb-3">
					<label class="form-label">Nom</label>
					<input v-model="form.name" class="form-control" required />
				</div>
				<div class="mb-3">
					<label class="form-label">Rôle</label>
					<input v-model="form.role" class="form-control" />
				</div>
				<div class="mb-3">
					<label class="form-label">Compétences (séparées par des virgules)</label>
					<input v-model="form.skillsText" class="form-control" placeholder="tri, conduite, nettoyage" />
				</div>
				<div class="mb-3 form-check">
					<input class="form-check-input" type="checkbox" v-model="form.available" id="empAvailable" />
					<label class="form-check-label" for="empAvailable">Disponible</label>
				</div>
				<div class="d-flex gap-2">
					<button class="btn btn-success" type="submit">Enregistrer</button>
					<button class="btn btn-secondary" type="button" @click="cancel">Annuler</button>
				</div>
			</form>
		</div>
	</DashboardLayout>
</template>

<script setup>
import DashboardLayout from '../layouts/DashboardLayout.vue'
import EmployeeService from '../services/EmployeeService.js'
import { ref, onMounted } from 'vue'

const employees = ref([])
const showForm = ref(false)
const editingId = ref(null)
const form = ref({ name: '', role: '', skillsText: '', available: true })

async function load() {
	try {
		const res = await EmployeeService.getAll()
		employees.value = res.data || []
	} catch (e) {
		employees.value = []
	}
}

onMounted(load)

function openAdd() {
	editingId.value = null
	form.value = { name: '', role: '', skillsText: '', available: true }
	showForm.value = true
}

function openEdit(e) {
	editingId.value = e.id
	form.value = { name: e.name || '', role: e.role || '', skillsText: (e.skills || []).join(', '), available: !!e.available }
	showForm.value = true
}

function cancel() { showForm.value = false }

async function save() {
	try {
		const payload = {
			name: form.value.name,
			role: form.value.role,
			skills: form.value.skillsText ? form.value.skillsText.split(',').map(s => s.trim()).filter(Boolean) : [],
			available: !!form.value.available
		}
		if (editingId.value) await EmployeeService.update(editingId.value, payload)
		else await EmployeeService.create(payload)
		await load()
		showForm.value = false
	} catch (e) {
		alert('Erreur lors de la sauvegarde')
	}
}

async function remove(id) {
	if (!confirm('Supprimer cet employé ?')) return
	try {
		await EmployeeService.delete(id)
		await load()
	} catch (e) {
		alert('Erreur lors de la suppression')
	}
}
</script>
