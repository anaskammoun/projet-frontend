<template>
	<DashboardLayout>
		<div class="d-flex justify-content-between align-items-center mb-3">
			<h2>Tournées</h2>
			<button class="btn btn-primary" @click="openAdd">Créer tournée</button>
		</div>

		<table class="table table-striped">
			<thead>
				<tr>
					<th>Date</th>
					<th>Points collecte</th>
					<th>Véhicule</th>
					<th>Employé</th>
					<th>Statut</th>
					<th>Distance (km)</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="t in tours" :key="t.id">
					<td>{{ formatDate(t.date) }}</td>
					<td>{{ (t.collectPoints || []).length }}</td>
					<td>{{ findVehicleName(t.vehicleId) }}</td>
					<td>{{ findEmployeeName(t.employeeId) }}</td>
					<td>{{ t.status }}</td>
					<td>{{ t.estimatedDistance ?? '-' }}</td>
					<td>
						<button class="btn btn-sm btn-warning me-1" @click="openEdit(t)">Modifier</button>
						<button class="btn btn-sm btn-danger" @click="removeTour(t.id)">Supprimer</button>
					</td>
				</tr>
			</tbody>
		</table>

		<div v-if="showForm" class="card mt-4 p-3">
			<h5>{{ editingId ? 'Modifier tournée' : 'Créer tournée' }}</h5>
			<form @submit.prevent="save">
				<div class="row">
					<div class="col-md-6 mb-3">
						<label class="form-label">Date et heure</label>
						<input type="datetime-local" v-model="form.dateLocal" class="form-control" required />
					</div>
					<div class="col-md-6 mb-3">
						<label class="form-label">Véhicule</label>
						<select v-model="form.vehicleId" class="form-select">
							<option value="">-- Aucun --</option>
							<option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.type || v.immatriculation || v.id }}</option>
						</select>
					</div>
				</div>

				<div class="mb-3">
					<label class="form-label">Points de collecte (sélection multiple)</label>
					<select v-model="form.collectPoints" class="form-select" multiple size="6">
						<option v-for="p in allPoints" :key="p.id" :value="p.id">{{ p.wasteType }} — {{ p.id }}</option>
					</select>
				</div>

				<div class="row">
					<div class="col-md-6 mb-3">
						<label class="form-label">Employé</label>
						<select v-model="form.employeeId" class="form-select">
							<option value="">-- Aucun --</option>
							<option v-for="e in employees" :key="e.id" :value="e.id">{{ e.name }}</option>
						</select>
					</div>
					<div class="col-md-3 mb-3">
						<label class="form-label">Statut</label>
						<select v-model="form.status" class="form-select">
							<option value="planifiée">planifiée</option>
							<option value="en cours">en cours</option>
							<option value="terminée">terminée</option>
						</select>
					</div>
					<div class="col-md-3 mb-3">
						<label class="form-label">Estimated Distance (km)</label>
						<input v-model.number="form.estimatedDistance" type="number" min="0" step="0.1" class="form-control" />
					</div>
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
import TourService from '../services/TourService.js'
import CollectPointService from '../services/CollectPointService.js'
import VehicleService from '../services/VehicleService.js'
import EmployeeService from '../services/EmployeeService.js'
import { ref, onMounted } from 'vue'

const tours = ref([])
const allPoints = ref([])
const vehicles = ref([])
const employees = ref([])

const showForm = ref(false)
const editingId = ref(null)
const form = ref({ dateLocal: '', collectPoints: [], vehicleId: '', employeeId: '', status: 'planifiée', estimatedDistance: 0 })

function formatDate(ts) {
	if (!ts) return '-'
	const d = new Date(Number(ts))
	return d.toLocaleString()
}

function toLocalInput(ts) {
	if (!ts) return ''
	const d = new Date(Number(ts))
	const pad = n => String(n).padStart(2,'0')
	const yyyy = d.getFullYear()
	const mm = pad(d.getMonth()+1)
	const dd = pad(d.getDate())
	const hh = pad(d.getHours())
	const min = pad(d.getMinutes())
	return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function fromLocalInput(local) {
	if (!local) return null
	return new Date(local).getTime()
}

function findVehicleName(id) { const v = vehicles.value.find(x=>x.id===id); return v ? (v.type || v.immatriculation || v.id) : '-' }
function findEmployeeName(id) { const e = employees.value.find(x=>x.id===id); return e ? (e.name || e.id) : '-' }

async function loadAll() {
	try {
		const [tRes, pRes, vRes, eRes] = await Promise.allSettled([
			TourService.getAll(),
			CollectPointService.getAll(),
			VehicleService.getAll(),
			EmployeeService.getAll()
		])
		tours.value = (tRes.status==='fulfilled' && tRes.value.data) ? tRes.value.data : []
		allPoints.value = (pRes.status==='fulfilled' && pRes.value.data) ? pRes.value.data : []
		vehicles.value = (vRes.status==='fulfilled' && vRes.value.data) ? vRes.value.data : []
		employees.value = (eRes.status==='fulfilled' && eRes.value.data) ? eRes.value.data : []
	} catch (e) { console.error(e); tours.value=[] }
}

onMounted(loadAll)

function openAdd(){ editingId.value=null; form.value={ dateLocal:'', collectPoints:[], vehicleId:'', employeeId:'', status:'planifiée', estimatedDistance:0 }; showForm.value=true }

function openEdit(t){
	editingId.value = t.id
	form.value = {
		dateLocal: toLocalInput(t.date),
		collectPoints: t.collectPoints ? [...t.collectPoints] : [],
		vehicleId: t.vehicleId || '',
		employeeId: t.employeeId || '',
		status: t.status || 'planifiée',
		estimatedDistance: t.estimatedDistance ?? 0
	}
	showForm.value = true
}

function cancel(){ showForm.value=false }

async function save(){
	try{
		const payload = {
			date: fromLocalInput(form.value.dateLocal),
			collectPoints: Array.isArray(form.value.collectPoints) ? form.value.collectPoints : [],
			vehicleId: form.value.vehicleId || null,
			employeeId: form.value.employeeId || null,
			status: form.value.status,
			estimatedDistance: Number(form.value.estimatedDistance) || 0
		}
		if(editingId.value) await TourService.update(editingId.value, payload)
		else await TourService.create(payload)
		await loadAll()
		showForm.value=false
	}catch(e){ alert('Erreur lors de l\'enregistrement') }
}

async function removeTour(id){ if(!confirm('Supprimer cette tournée ?')) return; try{ await TourService.delete(id); await loadAll() } catch(e){ alert('Erreur suppression') } }
</script>

<style scoped>
.table td, .table th { vertical-align: middle }
</style>
