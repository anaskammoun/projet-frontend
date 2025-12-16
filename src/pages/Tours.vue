<template>
	<DashboardLayout>
		<div class="d-flex justify-content-between align-items-center mb-3">
				<h2>Tournées</h2>
				<div>
					<button type="button" class="btn btn-outline-success me-2" @click="planifierIntelligent">Planification intelligente</button>
					<!--<button type="button" class="btn btn-primary" @click="openAdd">Créer tournée</button>-->
				</div>
			</div>

		<div class="card shadow-sm rounded-3 mb-3">
			<div class="card-body p-3">
				<MapView :routePoints="routePoints" :routeVehicle="routeVehicle" />
			</div>
		</div>

		<!-- Barre de recherche -->
		<div class="mb-3">
			<input v-model="searchQuery" type="text" class="form-control" placeholder="Rechercher par véhicule, employé, statut ou date" />
		</div>

		<!-- Filtre serveur par statut -->
		<div class="row g-3 mb-3">
			<div class="col-md-4">
				<label class="form-label">Filtrer par statut</label>
				<select v-model="statusFilter" class="form-select" @change="onStatusFilterChange">
					<option value="">Tous</option>
					<option value="planifiée">Planifiée</option>
					<option value="en cours">En cours</option>
					<option value="terminée">Terminée</option>
				</select>
			</div>
			<div class="col-md-8 d-flex align-items-end">
				<button type="button" class="btn btn-outline-secondary me-2" @click="clearStatusFilter">Réinitialiser</button>
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
						<button 
							type="button" 
							class="btn btn-sm btn-warning me-1" 
							@click="openEditModal(t)"
							:disabled="t.status === 'en cours' || t.status === 'terminée'"
							:title="(t.status === 'en cours' || t.status === 'terminée') ? 'Impossible de modifier une tournée en cours ou terminée' : 'Modifier cette tournée'"
						>
							Modifier
						</button>
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
									<th>Coordonnées</th>
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
									<td>{{ formatCoordinate(point.latitude) }}, {{ formatCoordinate(point.longitude) }}</td>
								</tr>
							</tbody>
							<tfoot>
								<tr class="table-light fw-bold">
									<td>{{ calculateAverageNiveau() }}%</td>
									<td>{{ calculateTotalCapacity() }} L</td>
									<td></td>
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

		<!-- Modal Modification Tournée -->
		<transition name="modal">
			<div v-if="showEditModal" class="modal-backdrop" @click.self="closeEditModal">
				<div class="modal-content-simple" style="max-width: 600px;">
					<div class="modal-header-simple">
						<h5 class="modal-title-simple">Modifier la tournée</h5>
						<button type="button" class="close-btn" @click="closeEditModal">&times;</button>
					</div>
					
					<div class="modal-body-simple">
						<div v-if="editFormError" class="alert alert-danger">{{ editFormError }}</div>
						<div v-if="capacityError" class="alert alert-warning">{{ capacityError }}</div>
						
						<form @submit.prevent="saveEdit">
							<div class="row">
								<div class="col-md-6 mb-3">
									<label class="form-label">Date et heure</label>
									<input type="datetime-local" v-model="editForm.dateLocal" class="form-control form-control-sm" required />
								</div>
								<div class="col-md-6 mb-3">
									<label class="form-label">Véhicule (disponibles)</label>
									<select v-model="editForm.vehicleId" class="form-select form-select-sm" @change="updateCapacityInfo">
										<option value="">-- Aucun --</option>
										<option v-for="v in availableVehicles" :key="v.id" :value="v.id">
											{{ v.matricule }} — {{ v.type }}
										</option>
									</select>
								</div>
							</div>

							<div class="mb-3">
								<label class="form-label">Points de collecte (sélection multiple)</label>
								<div v-if="vehicleCapacityInfo" class="small text-info mb-2">
									Capacité du véhicule: <strong>{{ vehicleCapacityInfo }} L</strong> | Utilisation: <strong>{{ totalPointsCapacity }} L</strong>
									<span v-if="totalPointsCapacity > vehicleCapacityInfo" class="text-danger">(⚠️ Dépassement!)</span>
								</div>
								<SearchMultiSelect
									v-model="editForm.collectPoints"
									:items="allPointsForSelect"
									placeholder="Rechercher un point..."
									:size="4"
									@update:modelValue="updateCapacityInfo"
								/>
							</div>

							<div class="mb-3">
								<label class="form-label">Employés (disponibles)</label>
								<SearchMultiSelect
									v-model="editForm.employeeIds"
									:items="availableEmployeesForSelect"
									placeholder="Rechercher un employé..."
									:size="3"
								/>
							</div>
						</form>
					</div>
					
					<div class="modal-footer-simple">
						<button type="button" class="btn btn-secondary btn-sm" @click="closeEditModal">Annuler</button>
						<button type="button" class="btn btn-primary btn-sm" @click="saveEdit" :disabled="capacityError || !editFormIsValid">Enregistrer</button>
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
							<li v-for="cp in (previewTour.collectPointsData || [])" :key="cp.id">
								{{ allPoints.find(p=>p.id===cp.id)?.wasteType || '-' }} — 
								({{ formatCoordinate(cp.latitude) }}, {{ formatCoordinate(cp.longitude) }})
							</li>
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
							<label class="form-label small mb-1">Véhicule (disponibles)</label>
							<select v-model="previewDraft.vehicleId" class="form-select form-select-sm">
								<option value="">-- Aucun --</option>
								<option v-for="v in availableVehicles" :key="v.id" :value="v.id">{{ v.matricule }} — {{ v.type }}</option>
							</select>
						</div>
						<div class="mb-2">
							<label class="form-label small mb-1">Points de collecte</label>
							<SearchMultiSelect v-model="previewDraft.collectPoints" :items="allPointsForSelect" size="4" />
						</div>
						<div class="mb-2">
							<label class="form-label small mb-1">Employés (disponibles)</label>
							<SearchMultiSelect v-model="previewDraft.employeeIds" :items="availableEmployeesForSelect" size="3" />
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
			<h5>Créer tournée</h5>
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
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const statsCards = ref([])
const showPreview = ref(false)
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

// Edit modal state
const showEditModal = ref(false)
const editForm = ref({
	dateLocal: '',
	collectPoints: [],
	vehicleId: '',
	employeeIds: [],
	status: 'planifiée',
	estimatedDistance: 0
})
const editFormError = ref('')
const capacityError = ref('')
const vehicleCapacityInfo = ref(null)
const totalPointsCapacity = ref(0)

const editFormIsValid = computed(() => {
	return editForm.value.collectPoints.length > 0 || editForm.value.employeeIds.length > 0
})

const filteredTours = computed(() => {
	const list = !searchQuery.value ? tours.value : tours.value.filter(t => {
		const query = searchQuery.value.toLowerCase()
		const vehicle = findVehicleLabel(t.vehicleData).toLowerCase()
		const employees = displayEmployees(t.employeesData || t.employees).toLowerCase()
		const status = (t.status || '').toLowerCase()
		const dateTokens = buildDateSearchTokens(t.date)
		const dateMatch = dateTokens.some(token => token.includes(query))
		return vehicle.includes(query) || employees.includes(query) || status.includes(query) || dateMatch
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

function buildDateSearchTokens(ts) {
	if (!ts) return []
	const d = new Date(Number(ts))
	if (Number.isNaN(d.getTime())) return []
	const pad = n => String(n).padStart(2, '0')
	const yyyy = d.getFullYear()
	const mm = pad(d.getMonth() + 1)
	const dd = pad(d.getDate())
	return [
		`${yyyy}-${mm}-${dd}`, // ISO-like
		`${dd}/${mm}/${yyyy}`, // JJ/MM/AAAA
		`${dd}-${mm}-${yyyy}`, // JJ-MM-AAAA
		d.toLocaleDateString('fr-FR'),
		d.toLocaleDateString('en-CA')
	].filter(Boolean).map(s => s.toLowerCase())
}

function fromLocalInput(local) {
	if (!local) return null
	return new Date(local).getTime()
}

function formatCoordinate(value) {
	if (value === null || value === undefined) return '-'
	return parseFloat(value).toFixed(6)
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
			const cin = e.cin || e.id
			const skill = e.selectedSkill || e.selected_skill || e.skill
			return skill ? `${cin} (${skill})` : cin
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

const availableVehicles = computed(() => vehicles.value.filter(v => v.available))

const allPointsForSelect = computed(() =>
	allPoints.value.map(p => {
		const lat = p.latitude !== null && p.latitude !== undefined ? parseFloat(p.latitude).toFixed(4) : '-'
		const lon = p.longitude !== null && p.longitude !== undefined ? parseFloat(p.longitude).toFixed(4) : '-'
		return { id: p.id, label: `${p.wasteType || '-'} — (${lat}, ${lon})` }
	})
)

const availableEmployeesForSelect = computed(() =>
	availableEmployees.value.map(e => ({ id: e.id, label: e.cin || e.id }))
)

async function loadAll() {
	try {
		const [tRes, pRes, vRes, eRes] = await Promise.allSettled([
			statusFilter.value ? TourService.getByStatus(statusFilter.value) : TourService.getAll(),
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

function loadTours() {
	currentPage.value = 1
	loadAll()
}

function onStatusFilterChange() {
	currentPage.value = 1
	loadTours()
}

function clearStatusFilter() {
	statusFilter.value = ''
	currentPage.value = 1
	loadTours()
}

onMounted(loadAll)

function openAdd() {
	editingId.value = null
	form.value = { dateLocal: '', collectPoints: [], vehicleId: '', employeeIds: [], status: 'planifiée', estimatedDistance: 0 }
	showForm.value = true
}

function openEditModal(t) {
	// Vérifier que la tournée est modifiable
	if (t.status === 'en cours' || t.status === 'terminée') {
		alert('⚠️ Impossible de modifier une tournée en cours ou terminée.')
		return
	}
	
	editForm.value = {
		dateLocal: toLocalInput(t.date),
		collectPoints: t.collectPointsData ? t.collectPointsData.map(cp => cp.id) : [],
		vehicleId: t.vehicleData?.id || '',
		employeeIds: t.employeesData?.map(e => e.id) || [],
		status: t.status || 'planifiée',
		estimatedDistance: t.estimatedDistance ?? 0
	}
	editingId.value = t.id
	capacityError.value = ''
	editFormError.value = ''
	updateCapacityInfo()
	showEditModal.value = true
}

function closeEditModal() {
	showEditModal.value = false
	editingId.value = null
	editForm.value = { dateLocal: '', collectPoints: [], vehicleId: '', employeeIds: [], status: 'planifiée', estimatedDistance: 0 }
	capacityError.value = ''
	editFormError.value = ''
	vehicleCapacityInfo.value = null
	totalPointsCapacity.value = 0
}

function updateCapacityInfo() {
	const vehicleId = editForm.value.vehicleId
	const pointIds = editForm.value.collectPoints || []
	
	// Reset
	vehicleCapacityInfo.value = null
	totalPointsCapacity.value = 0
	capacityError.value = ''
	
	if (!vehicleId) return
	
	const vehicle = vehicles.value.find(v => v.id === vehicleId)
	if (!vehicle) return
	
	vehicleCapacityInfo.value = vehicle.capacity
	
	// Calculate total capacity of selected points
	let total = 0
	pointIds.forEach(pointId => {
		const point = allPoints.value.find(p => p.id === pointId)
		if (point && point.capacityLiters) {
			total += point.capacityLiters
		}
	})
	totalPointsCapacity.value = total
	
	// Calculate distance from points
	const calculatedDistance = calculateDistanceFromPoints(pointIds)
	editForm.value.estimatedDistance = calculatedDistance
	
	// Check if exceeds capacity
	if (total > vehicle.capacity) {
		capacityError.value = `⚠️ Capacité dépassée! Points: ${total}L > Véhicule: ${vehicle.capacity}L`
	}
}

function calculateDistanceFromPoints(pointIds) {
	if (!pointIds || pointIds.length === 0) return 0
	
	let totalDistance = 0
	const points = pointIds.map(id => allPoints.value.find(p => p.id === id)).filter(Boolean)
	
	// Si on a au moins 2 points, calculer la distance entre eux (simple estimation)
	if (points.length >= 2) {
		for (let i = 0; i < points.length - 1; i++) {
			const p1 = points[i]
			const p2 = points[i + 1]
			
			// Formule simple de distance (Haversine)
			if (p1.latitude && p1.longitude && p2.latitude && p2.longitude) {
				const lat1 = p1.latitude * Math.PI / 180
				const lat2 = p2.latitude * Math.PI / 180
				const dLat = (p2.latitude - p1.latitude) * Math.PI / 180
				const dLon = (p2.longitude - p1.longitude) * Math.PI / 180
				
				const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
					Math.cos(lat1) * Math.cos(lat2) *
					Math.sin(dLon/2) * Math.sin(dLon/2)
				const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
				const R = 6371 // Rayon terrestre en km
				const distance = R * c
				
				totalDistance += distance
			}
		}
	}
	
	return parseFloat(totalDistance.toFixed(2))
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

function hasDriver(employeeIds) {
	return employeeIds.some(id => {
		const emp = employees.value.find(e => e.id === id)
		if (!emp || !emp.skills) return false
		return emp.skills.some(skill => 
			skill.toLowerCase().includes('conducteur') || 
			skill.toLowerCase().includes('chauffeur')
		)
	})
}

async function saveEdit() {
	try {
		editFormError.value = ''
		
		// Validation
		if (capacityError.value) {
			editFormError.value = capacityError.value
			return
		}
		
		if (!editFormIsValid.value) {
			editFormError.value = 'Veuillez sélectionner au moins un employé ou un point de collecte.'
			return
		}
		
		const employeeIds = Array.isArray(editForm.value.employeeIds)
			? editForm.value.employeeIds
			: editForm.value.employeeIds
			? [editForm.value.employeeIds]
			: []
		
		// Vérifier qu'il y a au moins un employé et un conducteur
		if (employeeIds.length === 0) {
			editFormError.value = '⚠️ Vous devez sélectionner au moins un employé pour la tournée.'
			return
		}
		
		if (!hasDriver(employeeIds)) {
			editFormError.value = '⚠️ Vous devez sélectionner au moins un employé avec la compétence "Conducteur"'
			return
		}
		
		// Build vehicle snapshot
		const vehicleData = editForm.value.vehicleId 
			? vehicles.value.find(v => v.id === editForm.value.vehicleId)
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
				cin: emp.cin,
				selectedSkill
			}
		}).filter(Boolean)
		
		const collectPointIds = Array.isArray(editForm.value.collectPoints) ? editForm.value.collectPoints : []
		const collectPointsData = collectPointIds.map(id => {
			const p = allPoints.value.find(pt => pt.id === id)
			if (!p) return { id }
			return {
				id: p.id,
				niveau: p.niveau ?? null,
				capacityLiters: p.capacityLiters ?? null,
				status: p.status ?? null,
				latitude: p.latitude ?? null,
				longitude: p.longitude ?? null
			}
		})

		const payload = {
			date: fromLocalInput(editForm.value.dateLocal),
			collectPointsData,
			vehicleData: vehicleSnapshot,
			employeesData: employeesSnapshots,
			status: editForm.value.status || 'planifiée',
			estimatedDistance: Number(editForm.value.estimatedDistance) || 0
		}
		
		await TourService.update(editingId.value, payload)
		await loadTours()
		closeEditModal()
	} catch (e) {
		console.error(e)
		editFormError.value = 'Erreur lors de l\'enregistrement'
	}
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
				cin: emp.cin,
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
				status: p.status ?? null,
				latitude: p.latitude ?? null,
				longitude: p.longitude ?? null
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
		await TourService.create(payload)
		await loadTours()
		showForm.value = false
	} catch (e) {
		alert("Erreur lors de l'enregistrement")
	}
}

async function removeTour(id) {
	if (!confirm('Supprimer cette tournée ?')) return
	try {
		await TourService.delete(id)
		await loadTours()
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
				cin: emp.cin,
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
				status: p.status ?? null,
				latitude: p.latitude ?? null,
				longitude: p.longitude ?? null
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
		return { id: emp.id, cin: emp.cin, selectedSkill: skill }
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
		await loadTours()
		alert('Tournée démarrée. Véhicule et employés associés sont maintenant indisponibles.')
	} catch (e) {
		alert('Erreur lors du démarrage de la tournée')
	}
}

async function terminerTour(id) {
	if (!confirm('Terminer cette tournée ?')) return
	try {
		await TourService.finishTour(id)
		await loadTours()
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
