<template>
	<DashboardLayout>
		<div class="d-flex justify-content-between align-items-center mb-3">
				<h2>Tournées</h2>
				<div>
					<button type="button" class="btn btn-outline-success me-2" @click="planifierIntelligent">Planification intelligente</button>
					<button type="button" class="btn btn-primary" @click="openAdd">Créer tournée</button>
				</div>
			</div>

		<div class="card shadow-sm rounded-3 mb-3">
			<div class="card-body p-3">
				<MapView :routePoints="routePoints" :routeVehicle="routeVehicle" />
			</div>
		</div>

		<table class="table table-striped">
			<thead>
				<tr>
					<th>Date</th>
					<th>Points collecte</th>
					<th>Véhicule</th>
					<th>Employés</th>
					<th>Statut</th>
					<th>Distance (km)</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="t in tours" :key="t.id">
					<td>{{ formatDate(t.date) }}</td>
					<td>{{ (t.collectPoints || []).length }}</td>
					<td>{{ findVehicleLabel(t.vehicleId) }}</td>
					<td>{{ displayEmployees(t) }}</td>
					<td>{{ t.status }}</td>
					<td>{{ formatDistance(t.estimatedDistance) }}</td>
					<td>
						<button type="button" class="btn btn-sm btn-info me-1" @click.prevent="showTourOnMap(t)">Afficher</button>
						<button type="button" class="btn btn-sm btn-warning me-1" @click="openEdit(t)">Modifier</button>
						<button type="button" class="btn btn-sm btn-danger me-1" @click="removeTour(t.id)">Supprimer</button>
						<button
							type="button"
							v-if="t.status === 'planifiée'"
							class="btn btn-sm btn-success"
							@click="demarrerTour(t.id)"
						>Démarrer</button>
						<button
							type="button"
							v-if="t.status === 'en cours'"
							class="btn btn-sm btn-primary ms-1"
							@click="terminerTour(t.id)"
						>Terminer</button>
					</td>

				</tr>
			</tbody>
		</table>

		<!-- Preview panel overlay (non-blocking) -->
		<div v-if="showPreview" class="preview-panel">
			<div class="preview-card">
				<div class="d-flex justify-content-between align-items-start">
					<div>
						<div class="fw-bold">Proposition de tournée</div>
						<div class="small text-muted">Véhicule: {{ findVehicleLabel(previewTour?.vehicleId) }}</div>
					</div>
					<button type="button" class="btn btn-sm btn-light" @click="refusePreview" title="Fermer">✕</button>
				</div>
				<hr />
				<div v-if="previewTour">
					<!-- editable draft view or read only -->
					<div v-if="!previewEdit">
						<div><strong>Points proposés ({{ (previewTour.collectPoints||[]).length }}):</strong></div>
						<ul class="mb-2">
							<li v-for="id in (previewTour.collectPoints || [])" :key="id">{{ allPoints.find(p=>p.id===id)?.wasteType || id }} — {{ id }}</li>
						</ul>
						<div><strong>Employés proposés:</strong> {{ (previewTour.employeeIds || []).map(id => (employees.find(e=>e.id===id)?.name) || id).join(', ') }}</div>
						<div class="mt-2"><strong>Distance estimée:</strong> {{ formatDistance(previewTour.estimatedDistance) }} km</div>
						<div class="d-flex gap-2 mt-3">
							<button type="button" class="btn btn-success" @click="acceptPreview">Accepter et créer</button>
							<button type="button" class="btn btn-outline-secondary" @click="refusePreview">Refuser</button>
							<button type="button" class="btn btn-sm btn-link" @click="startEditPreview">Modifier la proposition</button>
						</div>
					</div>
					<div v-else>
						<!-- Edit form, small --- reusing components and selects -->
						<div class="mb-2">
							<label class="form-label small mb-1">Date et heure</label>
							<input type="datetime-local" v-model="previewDraft.dateLocal" class="form-control form-control-sm" />
						</div>
						<div class="mb-2">
							<label class="form-label small mb-1">Véhicule</label>
							<select v-model="previewDraft.vehicleId" class="form-select form-select-sm">
								<option value="">-- Aucun --</option>
								<option v-for="v in vehicles" :key="v.id" :value="v.id">{{ v.matricule }} — {{ v.type }}</option>
							</select>
						</div>
						<div class="mb-2">
							<label class="form-label small mb-1">Points de collecte</label>
							<SearchMultiSelect v-model="previewDraft.collectPoints" :items="allPointsForSelect" size="4" />
						</div>
						<div class="mb-2">
							<label class="form-label small mb-1">Employés</label>
							<SearchMultiSelect v-model="previewDraft.employeeIds" :items="availableEmployeesForSelect" size="3" />
						</div>
						<div class="mb-2">
							<label class="form-label small mb-1">Distance estimée (km)</label>
							<input v-model.number="previewDraft.estimatedDistance" type="number" step="0.1" class="form-control form-control-sm" />
						</div>
						<div class="d-flex gap-2">
							<button type="button" class="btn btn-success btn-sm" @click="saveDraftPreview">Appliquer</button>
							<button type="button" class="btn btn-secondary btn-sm" @click="cancelEditPreview">Annuler</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div v-if="showForm" class="card mt-4 p-3">
			<h5>{{ editingId ? 'Modifier tournée' : 'Créer tournée' }}</h5>
			<div v-if="!isCreateValid" class="text-danger mb-2">
				Veuillez sélectionner au moins un employé ou un point de collecte.
			</div>
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
							<option v-for="v in vehicles" :key="v.id" :value="v.id">
								{{ v.matricule }} — {{ v.type }}
							</option>
						</select>
					</div>
				</div>

				<div class="mb-3">
					<label class="form-label">Points de collecte (sélection multiple)</label>
					<SearchMultiSelect
						v-model="form.collectPoints"
						:items="allPointsForSelect"
						placeholder="Rechercher un point..."
						:size="6"
					/>
				</div>

				<div class="row">
					<div class="col-md-6 mb-3">
						<label class="form-label">Employés (disponibles) — sélection multiple</label>
						<SearchMultiSelect
							v-model="form.employeeIds"
							:items="availableEmployeesForSelect"
							placeholder="Rechercher un employé..."
							:size="6"
						/>
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
						<label class="form-label">Distance estimée (km)</label>
						<input
							v-model.number="form.estimatedDistance"
							type="number"
							min="0"
							step="0.1"
							class="form-control"
						/>
					</div>
				</div>

				<div class="d-flex gap-2">
					<button class="btn btn-success" type="submit" :disabled="!isCreateValid">Enregistrer</button>
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
import { ref, onMounted, computed } from 'vue'
import SearchMultiSelect from '../components/SearchMultiSelect.vue'
import MapView from '../components/MapView.vue'
import { watch as watchRef } from 'vue'

const tours = ref([])
const allPoints = ref([])
const vehicles = ref([])
const employees = ref([])

const showForm = ref(false)
const editingId = ref(null)
const form = ref({
	dateLocal: '',
	collectPoints: [],
	vehicleId: '',
	employeeIds: [],
	status: 'planifiée',
	estimatedDistance: 0
})
const formError = ref('')

const routePoints = ref([])
const routeVehicle = ref(null)
	const previewTour = ref(null)
	const showPreview = ref(false)
	const previewEdit = ref(false)
	const previewDraft = ref(null)

const isCreateValid = computed(() => {
	if (editingId.value) return true
	const hasPoints = Array.isArray(form.value.collectPoints) && form.value.collectPoints.length > 0
	const hasEmployees = Array.isArray(form.value.employeeIds) && form.value.employeeIds.length > 0
	return hasPoints || hasEmployees
})

function formatDate(ts) {
	if (!ts) return '-'
	const d = new Date(Number(ts))
	return d.toLocaleString()
}

function formatDistance(d) {
	if (d === null || d === undefined || d === '-') return '-'
	const n = Number(d)
	if (Number.isNaN(n)) return '-'
	return n.toFixed(2)
}

function toLocalInput(ts) {
	if (!ts) return ''
	const d = new Date(Number(ts))
	const pad = n => String(n).padStart(2, '0')
	const yyyy = d.getFullYear()
	const mm = pad(d.getMonth() + 1)
	const dd = pad(d.getDate())
	const hh = pad(d.getHours())
	const min = pad(d.getMinutes())
	return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function fromLocalInput(local) {
	if (!local) return null
	return new Date(local).getTime()
}

function findVehicleLabel(id) {
	const v = vehicles.value.find(x => x.id === id)
	return v ? `${v.matricule} — ${v.type}` : '-'
}

function displayEmployees(t) {
	const ids = t.employeeIds && t.employeeIds.length ? t.employeeIds : (t.employeeId ? [t.employeeId] : [])
	if (!ids || ids.length === 0) return '-'
	const names = ids.map(id => {
		const e = employees.value.find(x => x.id === id)
		return e ? (e.name || e.id) : id
	})
	return names.join(', ')
}

const availableEmployees = computed(() => employees.value.filter(e => e.available))

const allPointsForSelect = computed(() =>
	allPoints.value.map(p => ({ id: p.id, label: `${p.wasteType || '-'} — ${p.id}` }))
)

const availableEmployeesForSelect = computed(() =>
	availableEmployees.value.map(e => ({ id: e.id, label: e.name || e.id }))
)

async function loadAll() {
	try {
		const [tRes, pRes, vRes, eRes] = await Promise.allSettled([
			TourService.getAll(),
			CollectPointService.getAll(),
			VehicleService.getAll(),
			EmployeeService.getAll()
		])
		tours.value = tRes.status === 'fulfilled' && tRes.value.data ? tRes.value.data : []
		allPoints.value = pRes.status === 'fulfilled' && pRes.value.data ? pRes.value.data : []
		vehicles.value = vRes.status === 'fulfilled' && vRes.value.data ? vRes.value.data : []
		employees.value = eRes.status === 'fulfilled' && eRes.value.data ? eRes.value.data : []
	} catch (e) {
		console.error(e)
		tours.value = []
	}
}

onMounted(loadAll)

function openAdd() {
	editingId.value = null
	form.value = { dateLocal: '', collectPoints: [], vehicleId: '', employeeIds: [], status: 'planifiée', estimatedDistance: 0 }
	showForm.value = true
}

function openEdit(t) {
	editingId.value = t.id
	form.value = {
		dateLocal: toLocalInput(t.date),
		collectPoints: t.collectPoints ? [...t.collectPoints] : [],
		vehicleId: t.vehicleId || '',
		employeeIds: t.employeeIds ? [...t.employeeIds] : (t.employeeId ? [t.employeeId] : []),
		status: t.status || 'planifiée',
		estimatedDistance: t.estimatedDistance ?? 0
	}
	showForm.value = true
}

function cancel() {
	showForm.value = false
}

async function save() {
	try {
		formError.value = ''
		if (!isCreateValid.value) {
			formError.value = 'Veuillez sélectionner au moins un employé ou un point de collecte.'
			return
		}
		const employeeIds = Array.isArray(form.value.employeeIds)
			? form.value.employeeIds
			: form.value.employeeIds
			? [form.value.employeeIds]
			: []
		const payload = {
			date: fromLocalInput(form.value.dateLocal),
			collectPoints: Array.isArray(form.value.collectPoints) ? form.value.collectPoints : [],
			vehicleId: form.value.vehicleId || null,
			employeeIds,
			employeeId: employeeIds.length ? employeeIds[0] : null,
			status: form.value.status || 'planifiée',
			estimatedDistance: Number(form.value.estimatedDistance) || 0
		}
		if (editingId.value) await TourService.update(editingId.value, payload)
		else await TourService.create(payload)
		await loadAll()
		showForm.value = false
	} catch (e) {
		alert("Erreur lors de l'enregistrement")
	}
}

async function removeTour(id) {
	if (!confirm('Supprimer cette tournée ?')) return
	try {
		await TourService.delete(id)
		await loadAll()
	} catch (e) {
		alert('Erreur suppression')
	}
}

async function planifierIntelligent() {
	try {
		// request a preview (proposal) from backend
		const res = await TourService.planifierPreview()
		if (res && res.data) {
			const tour = res.data
			previewTour.value = tour
			// initialize draft based on proposal so user can edit before acceptance
			previewDraft.value = {
				dateLocal: toLocalInput(tour.date),
				collectPoints: tour.collectPoints ? [...tour.collectPoints] : [],
				vehicleId: tour.vehicleId || '',
				employeeIds: tour.employeeIds ? [...tour.employeeIds] : [],
				estimatedDistance: tour.estimatedDistance ?? 0
			}
			const pts = (tour.collectPoints || []).map(id => allPoints.value.find(p => p.id === id)).filter(Boolean)
			const veh = vehicles.value.find(v => v.id === tour.vehicleId) || null
			routePoints.value = pts
			routeVehicle.value = veh
			showPreview.value = true
		} else {
			alert('Impossible de générer une proposition : aucun véhicule disponible ou pas de points compatibles.')
		}
	} catch (e) {
		console.error(e)
		alert('Erreur lors de la génération de la proposition de tournée')
	}
}

async function acceptPreview() {
	if (!previewTour.value) return
	try {
		// If user edited draft, prefer the draft values for creation
		const source = previewEdit.value && previewDraft.value ? previewDraft.value : previewTour.value
		// Build payload to create the tour on accept
		const payload = {
			date: fromLocalInput(source.dateLocal) || previewTour.value.date || Date.now(),
			collectPoints: source.collectPoints || previewTour.value.collectPoints || [],
			vehicleId: source.vehicleId || previewTour.value.vehicleId || null,
			employeeIds: source.employeeIds || previewTour.value.employeeIds || [],
			status: previewTour.value.status || 'planifiée',
			estimatedDistance: Number(source.estimatedDistance ?? previewTour.value.estimatedDistance) || 0
		}
		await TourService.create(payload)
		showPreview.value = false
		previewTour.value = null
		await loadAll()
		alert('Proposition acceptée et tournée créée.')
	} catch (e) {
		console.error(e)
		alert('Erreur lors de la création de la tournée')
	}
}

function refusePreview() {
	// simply close and clear preview
	showPreview.value = false
	previewTour.value = null
	routePoints.value = []
	routeVehicle.value = null
	previewEdit.value = false
	previewDraft.value = null
}

function startEditPreview() {
	if (!previewTour.value) return
	previewEdit.value = true
	// ensure draft exists
	previewDraft.value = previewDraft.value || {
		dateLocal: toLocalInput(previewTour.value.date),
		collectPoints: previewTour.value.collectPoints ? [...previewTour.value.collectPoints] : [],
		vehicleId: previewTour.value.vehicleId || '',
		employeeIds: previewTour.value.employeeIds ? [...previewTour.value.employeeIds] : [],
		estimatedDistance: previewTour.value.estimatedDistance ?? 0
	}
}

function cancelEditPreview() {
	previewEdit.value = false
	// reset draft to initial previewTour
	previewDraft.value = previewTour.value ? {
		dateLocal: toLocalInput(previewTour.value.date),
		collectPoints: previewTour.value.collectPoints ? [...previewTour.value.collectPoints] : [],
		vehicleId: previewTour.value.vehicleId || '',
		employeeIds: previewTour.value.employeeIds ? [...previewTour.value.employeeIds] : [],
		estimatedDistance: previewTour.value.estimatedDistance ?? 0
	} : null
}

function saveDraftPreview() {
	if (!previewTour.value || !previewDraft.value) return
	// apply draft to previewTour and update map preview
	previewTour.value.collectPoints = [...(previewDraft.value.collectPoints || [])]
	previewTour.value.vehicleId = previewDraft.value.vehicleId || previewTour.value.vehicleId
	previewTour.value.employeeIds = [...(previewDraft.value.employeeIds || [])]
	previewTour.value.estimatedDistance = Number(previewDraft.value.estimatedDistance || previewTour.value.estimatedDistance)
	// update the map routePoints and routeVehicle
	routePoints.value = (previewTour.value.collectPoints || []).map(id => allPoints.value.find(p => p.id === id)).filter(Boolean)
	routeVehicle.value = vehicles.value.find(v => v.id === previewTour.value.vehicleId) || null
	previewEdit.value = false
}

// keep map preview in sync while editing the draft
watchRef(() => previewDraft.value, (d) => {
	if (!previewEdit.value || !d) return
	routePoints.value = (d.collectPoints || []).map(id => allPoints.value.find(p => p.id === id)).filter(Boolean)
	routeVehicle.value = vehicles.value.find(v => v.id === d.vehicleId) || null
}, { deep: true })

function showTourOnMap(t) {
	const pts = (t.collectPoints || []).map(id => allPoints.value.find(p => p.id === id)).filter(Boolean)
	const veh = vehicles.value.find(v => v.id === t.vehicleId) || null
	routePoints.value = pts
	routeVehicle.value = veh
}

				async function demarrerTour(id) {
					if (!confirm('Démarrer cette tournée ?')) return
					try {
						await TourService.startTour(id)
						await loadAll()
						alert('Tournée démarrée. Véhicule et employés associés sont maintenant indisponibles.')
					} catch (e) {
						alert('Erreur lors du démarrage de la tournée')
					}
				}

async function terminerTour(id) {
	if (!confirm('Terminer cette tournée ?')) return
	try {
		await TourService.finishTour(id)
		await loadAll()
		alert('Tournée terminée. Véhicule et employés associés sont libérés (disponibles).')
	} catch (e) {
		alert("Erreur lors de la terminaison de la tournée")
	}
}
</script>

<style scoped>
.table td,
.table th {
	vertical-align: middle;
}
/* Preview panel overlay for proposed tour */
.preview-panel {
	position: absolute;
	right: 28px;
	top: 140px; /* sits over the map card */
	z-index: 800;
}
.preview-card {
	width: 360px;
	background: white;
	padding: 14px;
	border-radius: 8px;
	box-shadow: 0 8px 32px rgba(0,0,0,0.12);
}

/* Removed erroneous placeholder */
</style>
