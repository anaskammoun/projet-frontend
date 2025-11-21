<template>
	<DashboardLayout>
		<div class="d-flex justify-content-between align-items-center mb-3">
			<h2>Véhicules</h2>
			<button class="btn btn-primary" @click="openAdd">Ajouter</button>
		</div>

		<table class="table table-hover">
			<thead>
				<tr><th>Type</th><th>Capacité (L)</th><th>Disponible</th><th>Actions</th></tr>
			</thead>
			<tbody>
				<tr v-for="v in vehicles" :key="v.id">
					<td>{{ v.type }}</td>
					<td>{{ v.capacity ?? '-' }}</td>
					<td>{{ v.available ? 'Oui' : 'Non' }}</td>
					<td>
						<button class="btn btn-sm btn-warning me-1" @click="openEdit(v)">Modifier</button>
						<button class="btn btn-sm btn-danger" @click="remove(v.id)">Supprimer</button>
					</td>
				</tr>
			</tbody>
		</table>

		<div v-if="showForm" class="card mt-4 p-3">
			<h5>{{ editingId ? 'Modifier véhicule' : 'Ajouter véhicule' }}</h5>
			<form @submit.prevent="save">
				<div class="mb-3">
					<label class="form-label">Type</label>
					<input v-model="form.type" class="form-control" placeholder="compacteur, benne..." required />
				</div>
				<div class="mb-3">
					<label class="form-label">Capacité (L)</label>
					<input v-model.number="form.capacity" type="number" min="0" class="form-control" />
				</div>
				<div class="mb-3 form-check">
					<input class="form-check-input" type="checkbox" v-model="form.available" id="vehAvailable" />
					<label class="form-check-label" for="vehAvailable">Disponible</label>
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
import VehicleService from '../services/VehicleService.js'
import { ref, onMounted } from 'vue'

const vehicles = ref([])
const showForm = ref(false)
const editingId = ref(null)
const form = ref({ type: '', capacity: 0, available: true })

async function load() {
	try { const res = await VehicleService.getAll(); vehicles.value = res.data || [] } catch(e){ vehicles.value = [] }
}

onMounted(load)

function openAdd() {
	editingId.value = null
	form.value = { type: '', capacity: 0, available: true }
	showForm.value = true
}

function openEdit(v) {
	editingId.value = v.id
	form.value = { type: v.type || '', capacity: v.capacity ?? 0, available: !!v.available }
	showForm.value = true
}

function cancel() { showForm.value = false }

async function save() {
	try {
		const payload = { type: form.value.type, capacity: form.value.capacity, available: !!form.value.available }
		if (editingId.value) await VehicleService.update(editingId.value, payload)
		else await VehicleService.create(payload)
		await load()
		showForm.value = false
	} catch(e) { alert('Erreur lors de la sauvegarde') }
}

async function remove(id) {
	if (!confirm('Supprimer ce véhicule ?')) return
	try { await VehicleService.delete(id); await load() } catch(e){ alert('Erreur lors de la suppression') }
}
</script>
