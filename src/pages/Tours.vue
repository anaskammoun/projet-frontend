<template>
	<DashboardLayout>
		<div class="d-flex justify-content-between align-items-center mb-3">
				<h2>Tournées</h2>
				<div>
					<button type="button" class="btn btn-outline-success me-2" @click="planifierIntelligent">Planification intelligente</button>
					<button type="button" class="btn btn-primary" @click="openAdd">Créer tournée</button>
				</div>
			</div>

		<!-- Performance cards moved from dashboard -->
		<div class="card shadow-sm border-0 rounded-3 mb-4">
			<div class="card-body">
				<div class="d-flex justify-content-between align-items-center mb-3">
					<h5 class="fw-bold mb-0 text-secondary">Performance des tournées</h5>
					<span class="text-muted small">Statut + remplissage conteneurs</span>
				</div>
				<div class="row g-3">
					<div class="col-md-3" v-for="card in statsCards" :key="card.title">
						<DataCard
							:title="card.title"
							:value="card.value"
							class="shadow-sm border-0 rounded-3 h-100"
						/>
					</div>
				</div>
			</div>
		</div>

		<div class="card shadow-sm rounded-3 mb-3">
			<div class="card-body p-3">
				<MapView :routePoints="routePoints" :routeVehicle="routeVehicle" />
			</div>
		</div>

		<!-- Barre de recherche -->
		<div class="mb-3">
			<input v-model="searchQuery" type="text" class="form-control" placeholder="Rechercher par véhicule, employé ou statut..." />
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
				<tr v-if="paginatedTours.length === 0">
					<td colspan="7" class="text-center text-muted">Aucune tournée trouvée</td>
				</tr>
				<tr v-for="t in paginatedTours" :key="t.id">
					<td>{{ formatDate(t.date) }}</td>
					<td>{{ (t.collectPointsData || []).length }}</td>
					<td>{{ findVehicleLabel(t.vehicleData) }}</td>
					<td>{{ displayEmployees(t.employeesData || t.employees) }}</td>
					<td>{{ t.status }}</td>
					<td>{{ formatDistance(t.estimatedDistance) }}</td>
					<td>
						<button type="button" class="btn btn-sm btn-info me-1" @click.prevent="showTourOnMap(t)">Afficher</button>
						<button type="button" class="btn btn-sm btn-secondary me-1" @click="showPointsDetails(t)">Détails points</button>
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

		<!-- Pagination -->
		<nav v-if="totalPages > 1" aria-label="Pagination">
			<ul class="pagination justify-content-center">
				<li class="page-item" :class="{ disabled: currentPage === 1 }">
					<button class="page-link" @click="currentPage = 1" :disabled="currentPage === 1">«</button>
				</li>
				<li class="page-item" :class="{ disabled: currentPage === 1 }">
					<button class="page-link" @click="currentPage--" :disabled="currentPage === 1">‹</button>
				</li>
				<li v-for="page in visiblePages" :key="page" class="page-item" :class="{ active: page === currentPage }">
					<button class="page-link" @click="currentPage = page">{{ page }}</button>
				</li>
				<li class="page-item" :class="{ disabled: currentPage === totalPages }">
					<button class="page-link" @click="currentPage++" :disabled="currentPage === totalPages">›</button>
				</li>
				<li class="page-item" :class="{ disabled: currentPage === totalPages }">
					<button class="page-link" @click="currentPage = totalPages" :disabled="currentPage === totalPages">»</button>
				</li>
			</ul>
			<div class="text-center text-muted small">Page {{ currentPage }} sur {{ totalPages }} ({{ filteredTours.length }} résultats)</div>
		</nav>

		<!-- Modal Détails des points de collecte imbriqués -->
		<transition name="modal">
			<div v-if="showPointsModal" class="modal-backdrop" @click.self="closePointsModal">
				<div class="modal-content-simple">
					<div class="modal-header-simple">
						<h5 class="modal-title-simple">Détails des points de collecte</h5>
						<button type="button" class="close-btn" @click="closePointsModal">&times;</button>
					</div>
					
					<div class="modal-body-simple">
						<div v-if="tourPointsDetails.length === 0" class="alert alert-info">
							Aucun point de collecte associé à cette tournée.
						</div>
						
						<table v-else class="table table-sm table-bordered">
							<thead class="table-light">
								<tr>
									<th>Niveau (%)</th>
									<th>Capacité (L)</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="point in tourPointsDetails" :key="point.id">
									<td>
										<span :class="getNiveauBadgeClass(point.niveau)">{{ formatNiveauValue(point.niveau) }}%</span>
									</td>
									<td>{{ point.capacityLiters ?? '-' }}</td>
									<td>
										<span :class="getStatusBadgeClass(point.status)">{{ point.status }}</span>
									</td>
								</tr>
							</tbody>
							<tfoot>
								<tr class="table-light fw-bold">
									<td>{{ calculateAverageNiveau() }}%</td>
									<td>{{ calculateTotalCapacity() }} L</td>
									<td></td>
								</tr>
							</tfoot>
						</table>
					</div>
					
					<div class="modal-footer-simple">
						<button type="button" class="btn btn-secondary btn-sm" @click="closePointsModal">Fermer</button>
					</div>
				</div>
			</div>
		</transition>

		<!-- Preview panel overlay (non-blocking) -->
		<div v-if="showPreview" class="preview-panel">
			<div class="preview-card">
				<div class="d-flex justify-content-between align-items-start">
					<div>
						<div class="fw-bold">Proposition de tournée</div>
						<div class="small text-muted">Véhicule: {{ findVehicleLabel(previewTour?.vehicleData) }}</div>
					</div>
					<button type="button" class="btn btn-sm btn-light" @click="refusePreview" title="Fermer">✕</button>
				</div>
				<hr />
				<div v-if="previewTour">
					<!-- editable draft view or read only -->
					<div v-if="!previewEdit">
						<div><strong>Points proposés ({{ (previewTour.collectPointsData||[]).length }}):</strong></div>
						<ul class="mb-2">
							<li v-for="cp in (previewTour.collectPointsData || [])" :key="cp.id">{{ allPoints.find(p=>p.id===cp.id)?.wasteType || cp.id }} — {{ cp.id }}</li>
						</ul>
						<div><strong>Employés proposés:</strong> {{ displayEmployees(previewTour.employeesData || previewTour.employees) }}</div>
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
import DataCard from '../components/DataCard.vue'

const tours = ref([])
const allPoints = ref([])
const vehicles = ref([])
const employees = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const statsCards = ref([
	{ title: 'Tournées planifiées', value: '—' },
	{ title: 'Tournées en cours', value: '—' },
	{ title: 'Tournées terminées', value: '—' },
	{ title: 'Taux de remplissage moyen', value: '—' }
])

const showForm = ref(false)
const editingId = ref(null)
const showPointsModal = ref(false)
const selectedTourForPoints = ref(null)
const tourPointsDetails = ref([])
const form = ref({
	dateLocal: '',
	collectPoints: [],
	vehicleId: '',
	employeeIds: [],
	status: 'planifiée',
	estimatedDistance: 0
})
const formError = ref('')

const filteredTours = computed(() => {
	const list = !searchQuery.value ? tours.value : tours.value.filter(t => {
		const query = searchQuery.value.toLowerCase()
		const vehicle = findVehicleLabel(t.vehicleData).toLowerCase()
		const employees = displayEmployees(t.employeesData || t.employees).toLowerCase()
		const status = (t.status || '').toLowerCase()
		return vehicle.includes(query) || employees.includes(query) || status.includes(query)
	})
	// Inverser l'ordre pour afficher les nouveaux en haut
	return [...list].reverse()
})

const totalPages = computed(() => Math.ceil(filteredTours.value.length / itemsPerPage))

const paginatedTours = computed(() => {
	const start = (currentPage.value - 1) * itemsPerPage
	const end = start + itemsPerPage
	return filteredTours.value.slice(start, end)
})

const visiblePages = computed(() => {
	const pages = []
	const total = totalPages.value
	const current = currentPage.value
	const delta = 2
	const left = Math.max(2, current - delta)
	const right = Math.min(total - 1, current + delta)
	
	pages.push(1)
	if (left > 2) pages.push('...')
	for (let i = left; i <= right; i++) pages.push(i)
	if (right < total - 1) pages.push('...')
	if (total > 1) pages.push(total)
	
	return pages.filter((v, i, arr) => arr.indexOf(v) === i)
})

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

function findVehicleLabel(vehicleData) {
	// Utiliser uniquement les données imbriquées
	if (vehicleData) {
		return `${vehicleData.matricule} — ${vehicleData.type}`
	}
	return '-'
}

function displayEmployees(employeesData) {
	// Utiliser uniquement les données imbriquées
	const embedded = employeesData && employeesData.length ? employeesData : []
	if (embedded.length > 0) {
		return embedded.map(e => {
			const name = e.name || e.id
			const skill = e.selectedSkill || e.selected_skill || e.skill
			return skill ? `${name} (${skill})` : name
		}).join(', ')
	}
	return '-'
}

function showPointsDetails(tour) {
	selectedTourForPoints.value = tour
	tourPointsDetails.value = tour.collectPointsData || []
	showPointsModal.value = true
}

function closePointsModal() {
	showPointsModal.value = false
	selectedTourForPoints.value = null
	tourPointsDetails.value = []
}

function formatNiveauValue(niveau) {
	if (niveau == null) return '-'
	return niveau.toFixed(2)
}

function getNiveauBadgeClass(niveau) {
	if (niveau == null) return 'badge bg-secondary'
	if (niveau === 0) return 'badge bg-secondary'
	if (niveau <= 50) return 'badge bg-success'
	if (niveau <= 80) return 'badge bg-warning'
	return 'badge bg-danger'
}

function getNiveauColor(niveau) {
	if (niveau == null) return '#6c757d' // gray
	if (niveau === 0) return '#6c757d' // gray
	if (niveau <= 50) return '#28a745' // green
	if (niveau <= 80) return '#ffc107' // yellow
	return '#dc3545' // red
}

function getStatusBadgeClass(status) {
	if (status === 'VIDE') return 'badge bg-secondary'
	if (status === 'NORMAL') return 'badge bg-success'
	if (status === 'PRESQUE_PLEIN') return 'badge bg-warning'
	if (status === 'PLEIN') return 'badge bg-danger'
	return 'badge bg-info'
}

function calculateAverageNiveau() {
	if (tourPointsDetails.value.length === 0) return 0
	const total = tourPointsDetails.value.reduce((sum, p) => sum + (p.niveau || 0), 0)
	return (total / tourPointsDetails.value.length).toFixed(2)
}

function calculateTotalCapacity() {
	if (tourPointsDetails.value.length === 0) return 0
	return tourPointsDetails.value.reduce((sum, p) => sum + (p.capacityLiters || 0), 0).toFixed(2)
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
		const [tRes, pRes, vRes, eRes, statsRes] = await Promise.allSettled([
			TourService.getAll(),
			CollectPointService.getAll(),
			VehicleService.getAll(),
			EmployeeService.getAll(),
			TourService.getStats()
		])
		tours.value = tRes.status === 'fulfilled' && tRes.value.data ? tRes.value.data : []
		allPoints.value = pRes.status === 'fulfilled' && pRes.value.data ? pRes.value.data : []
		vehicles.value = vRes.status === 'fulfilled' && vRes.value.data ? vRes.value.data : []
		employees.value = eRes.status === 'fulfilled' && eRes.value.data ? eRes.value.data : []

		const stats = statsRes.status === 'fulfilled' ? statsRes.value.data : null
		if (stats) {
			statsCards.value = [
				{ title: 'Tournées planifiées', value: stats.plannedCount ?? 0 },
				{ title: 'Tournées en cours', value: stats.inProgressCount ?? 0 },
				{ title: 'Tournées terminées', value: stats.completedCount ?? 0 },
				{ title: 'Taux de remplissage moyen', value: `${stats.averageFillRate ?? 0}%` }
			]
		}
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
		collectPoints: t.collectPointsData ? t.collectPointsData.map(cp => cp.id) : [],
		vehicleId: t.vehicleData?.id || '',
		employeeIds: t.employeesData?.map(e => e.id) || [],
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
		
		// Build vehicle snapshot
		const vehicleData = form.value.vehicleId 
			? vehicles.value.find(v => v.id === form.value.vehicleId)
			: null
		const vehicleSnapshot = vehicleData ? {
			id: vehicleData.id,
			matricule: vehicleData.matricule,
			type: vehicleData.type
		} : null
		
		// Build employees snapshots
		const employeesSnapshots = employeeIds.map(id => {
			const emp = employees.value.find(e => e.id === id)
			if (!emp) return null
			const selectedSkill = emp.skills && emp.skills.length > 0 
				? (emp.skills.find(s => s.toLowerCase().includes('conducteur') || s.toLowerCase().includes('chauffeur')) || emp.skills[0])
				: null
			return {
				id: emp.id,
				name: emp.name,
				selectedSkill
			}
		}).filter(Boolean)
		
		const collectPointIds = Array.isArray(form.value.collectPoints) ? form.value.collectPoints : []
		const collectPointsData = collectPointIds.map(id => {
			const p = allPoints.value.find(pt => pt.id === id)
			if (!p) return { id }
			return {
				id: p.id,
				niveau: p.niveau ?? null,
				capacityLiters: p.capacityLiters ?? null,
				status: p.status ?? null
			}
		})

		const payload = {
			date: fromLocalInput(form.value.dateLocal),
			collectPointsData,
			vehicleData: vehicleSnapshot,
			employeesData: employeesSnapshots,
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
				collectPoints: tour.collectPointsData ? tour.collectPointsData.map(cp => cp.id) : [],
				vehicleId: tour.vehicleData?.id || '',
				employeeIds: tour.employeesData?.map(e => e.id) || [],
				estimatedDistance: tour.estimatedDistance ?? 0
			}
			const pts = (tour.collectPointsData || []).map(cp => allPoints.value.find(p => p.id === cp.id)).filter(Boolean)
			const veh = tour.vehicleData?.id ? vehicles.value.find(v => v.id === tour.vehicleData.id) : null
			routePoints.value = pts
			routeVehicle.value = veh
			showPreview.value = true
		} else {
			alert('Impossible de générer une proposition : aucun véhicule disponible ou pas de points compatibles.')
		}
	} catch (e) {
		console.error(e)
		// Afficher le message d'erreur spécifique du backend
		const errorMessage = e.response?.data || e.message || 'Erreur lors de la génération de la proposition de tournée'
		alert(errorMessage)
	}
}

async function acceptPreview() {
	if (!previewTour.value) return
	try {
		// If user edited draft, prefer the draft values for creation
		const source = previewEdit.value && previewDraft.value ? previewDraft.value : previewTour.value
		
		// Build vehicle snapshot
		const vehicleId = source.vehicleId || previewTour.value.vehicleData?.id
		const vehicleData = vehicleId ? vehicles.value.find(v => v.id === vehicleId) : null
		const vehicleSnapshot = vehicleData ? {
			id: vehicleData.id,
			matricule: vehicleData.matricule,
			type: vehicleData.type
		} : previewTour.value.vehicleData
		
		// Build employees snapshots
		const employeeIds = source.employeeIds || previewTour.value.employeesData?.map(e => e.id) || []
		const employeesSnapshots = employeeIds.map(id => {
			const emp = employees.value.find(e => e.id === id)
			if (!emp) return null
			const selectedSkill = emp.skills && emp.skills.length > 0 
				? (emp.skills.find(s => s.toLowerCase().includes('conducteur') || s.toLowerCase().includes('chauffeur')) || emp.skills[0])
				: null
			return {
				id: emp.id,
				name: emp.name,
				selectedSkill
			}
		}).filter(Boolean)
		
		const collectPointIds = source.collectPoints && source.collectPoints.length
			? source.collectPoints
			: (previewTour.value.collectPointsData || []).map(cp => cp.id)
		const collectPointsData = collectPointIds.map(id => {
			const p = allPoints.value.find(pt => pt.id === id)
			if (!p) return { id }
			return {
				id: p.id,
				niveau: p.niveau ?? null,
				capacityLiters: p.capacityLiters ?? null,
				status: p.status ?? null
			}
		})

		// Build payload to create the tour on accept
		const payload = {
			date: fromLocalInput(source.dateLocal) || previewTour.value.date || Date.now(),
			collectPointsData,
			vehicleData: vehicleSnapshot,
			employeesData: employeesSnapshots.length > 0 ? employeesSnapshots : previewTour.value.employeesData,
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
		const errorMessage = e.response?.data || e.message || 'Erreur lors de la création de la tournée'
		alert(errorMessage)
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
		collectPoints: previewTour.value.collectPointsData ? previewTour.value.collectPointsData.map(cp => cp.id) : [],
		vehicleId: previewTour.value.vehicleData?.id || '',
		employeeIds: previewTour.value.employeesData ? previewTour.value.employeesData.map(e => e.id) : [],
		estimatedDistance: previewTour.value.estimatedDistance ?? 0
	}
}

function cancelEditPreview() {
	previewEdit.value = false
	// reset draft to initial previewTour
	previewDraft.value = previewTour.value ? {
		dateLocal: toLocalInput(previewTour.value.date),
		collectPoints: previewTour.value.collectPointsData ? previewTour.value.collectPointsData.map(cp => cp.id) : [],
		vehicleId: previewTour.value.vehicleData?.id || '',
		employeeIds: previewTour.value.employeesData ? previewTour.value.employeesData.map(e => e.id) : [],
		estimatedDistance: previewTour.value.estimatedDistance ?? 0
	} : null
}

function saveDraftPreview() {
	if (!previewTour.value || !previewDraft.value) return
	// apply draft to previewTour and update map preview
	const draftIds = [...(previewDraft.value.collectPoints || [])]
	previewTour.value.collectPointsData = draftIds.map(id => ({ id }))
	previewTour.value.vehicleData = previewDraft.value.vehicleId
		? vehicles.value.find(v => v.id === previewDraft.value.vehicleId) || previewTour.value.vehicleData
		: previewTour.value.vehicleData
	previewTour.value.employeesData = (previewDraft.value.employeeIds || []).map(id => {
		const emp = employees.value.find(e => e.id === id)
		if (!emp) return { id }
		const skill = emp.skills && emp.skills.length > 0
			? (emp.skills.find(s => s.toLowerCase().includes('conducteur') || s.toLowerCase().includes('chauffeur')) || emp.skills[0])
			: null
		return { id: emp.id, name: emp.name, selectedSkill: skill }
	})
	previewTour.value.estimatedDistance = Number(previewDraft.value.estimatedDistance || previewTour.value.estimatedDistance)
	// update the map routePoints and routeVehicle
	routePoints.value = (previewTour.value.collectPointsData || []).map(cp => allPoints.value.find(p => p.id === cp.id)).filter(Boolean)
	const vehicleId = previewDraft.value.vehicleId || previewTour.value.vehicleData?.id
	routeVehicle.value = vehicleId ? (vehicles.value.find(v => v.id === vehicleId) || null) : null
	previewEdit.value = false
}

// keep map preview in sync while editing the draft
watchRef(() => previewDraft.value, (d) => {
	if (!previewEdit.value || !d) return
	routePoints.value = (d.collectPoints || []).map(id => allPoints.value.find(p => p.id === id)).filter(Boolean)
	const vehicleId = d.vehicleId || previewTour.value?.vehicleData?.id
	routeVehicle.value = vehicleId ? (vehicles.value.find(v => v.id === vehicleId) || null) : null
}, { deep: true })

function showTourOnMap(t) {
	const pts = (t.collectPointsData || []).map(cp => allPoints.value.find(p => p.id === cp.id)).filter(Boolean)
	const vehicleId = t.vehicleData?.id
	const veh = vehicleId ? (vehicles.value.find(v => v.id === vehicleId) || null) : null
	routePoints.value = pts
	routeVehicle.value = veh
	
	// Scroll automatique vers la carte
	setTimeout(() => {
		const mapCard = document.querySelector('.card.shadow-sm.rounded-3')
		if (mapCard) {
			mapCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
	}, 100)
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

/* Modal Styles - Simple & Basic */
.modal-backdrop {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1050;
}

.modal-content-simple {
	background: white;
	border-radius: 6px;
	width: 95%;
	max-width: 800px;
	box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
	max-height: 90vh;
	overflow-y: auto;
}

.modal-header-simple {
	background-color: #f8f9fa;
	padding: 15px 20px;
	border-bottom: 1px solid #dee2e6;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border-radius: 6px 6px 0 0;
}

.modal-title-simple {
	margin: 0;
	font-size: 1.25rem;
	font-weight: 500;
	color: #333;
}

.close-btn {
	background: none;
	border: none;
	font-size: 24px;
	cursor: pointer;
	color: #666;
	opacity: 0.7;
	transition: opacity 0.2s;
	padding: 0;
	line-height: 1;
}

.close-btn:hover {
	opacity: 1;
}

.modal-body-simple {
	padding: 20px;
}

.modal-footer-simple {
	padding: 15px 20px;
	background-color: #f8f9fa;
	border-top: 1px solid #dee2e6;
	border-radius: 0 0 6px 6px;
	display: flex;
	justify-content: flex-end;
	gap: 10px;
}

/* Badge Styles */
.badge-success {
	background-color: #d4edda;
	color: #155724;
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 0.85rem;
	font-weight: 500;
}

.badge-warning {
	background-color: #fff3cd;
	color: #856404;
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 0.85rem;
	font-weight: 500;
}

.badge-danger {
	background-color: #f8d7da;
	color: #721c24;
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 0.85rem;
	font-weight: 500;
}

.badge-info {
	background-color: #d1ecf1;
	color: #0c5460;
	padding: 4px 8px;
	border-radius: 4px;
	font-size: 0.85rem;
	font-weight: 500;
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
	transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
	opacity: 0;
}

.modal-enter-to,
.modal-leave-from {
	opacity: 1;
}
</style>
