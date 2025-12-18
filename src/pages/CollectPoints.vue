<template>
  <DashboardLayout>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Points de collecte</h2>
    <div>
  <button v-if="isStaff" type="button" class="btn btn-primary me-2" @click="openAdd">Ajouter</button>
  <button type="button" v-if="!simulationRunning" class="btn btn-success" @click="startRealtimeUpdate">Démarrer simulation</button>
  <button type="button" v-else class="btn btn-danger" @click="stopRealtimeUpdate">Arrêter simulation</button>
</div>
    </div>

    <!-- Barre de recherche -->
    <div class="mb-3">
      <input v-model="searchQuery" type="text" class="form-control" placeholder="Rechercher par type de déchet, statut ou coordonnées..." />
    </div>

    <!-- Filtres serveur -->
    <div class="row g-3 mb-3">
      <div class="col-md-4">
        <label class="form-label">Filtrer par statut</label>
        <select v-model="statusFilter" class="form-select" @change="onFiltersChange">
          <option value="">Tous</option>
          <option value="VIDE">VIDE</option>
          <option value="NORMAL">NORMAL</option>
          <option value="PRESQUE_PLEIN">PRESQUE_PLEIN</option>
          <option value="PLEIN">PLEIN</option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Filtrer par type</label>
        <select v-model="wasteTypeFilter" class="form-select" @change="onFiltersChange">
          <option value="">Tous</option>
          <option value="plastique">Plastique</option>
          <option value="organique">Organique</option>
          <option value="verre">Verre</option>
          <option value="papier">Papier</option>
        </select>
      </div>
      <div class="col-md-4 d-flex align-items-end">
        <button type="button" class="btn btn-outline-secondary me-2" @click="clearServerFilters">Réinitialiser filtres</button>
      </div>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Waste Type</th>
          <th>Capacity (L)</th>
          <th>Max Capacity (L)</th>
          <th>Niveau (%)</th>
          <th>Status</th>
          <th>Coordonnées</th>
          <th v-if="isStaff">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paginatedPoints.length === 0">
          <td colspan="7" class="text-center text-muted">Aucun point de collecte trouvé</td>
        </tr>
        <tr v-for="p in paginatedPoints" :key="p.id">
          <td>{{ p.wasteType || '-' }}</td>
          <td>{{ p.capacityLiters ?? '-' }}</td>
          <td>{{ p.maxCapacityLiters ?? '-' }}</td>
          <td>{{ formatNiveau(p) }}</td>
          <td>{{ computeStatus(p) }}</td>
          <td>{{ formatCoordinate(p.latitude) }},{{ formatCoordinate(p.longitude) }}</td>
          <td v-if="isStaff">
            <button type="button" class="btn btn-sm btn-warning me-1" @click="openEdit(p)">Modifier</button>
            <button type="button" class="btn btn-sm btn-danger" @click="remove(p.id)">Supprimer</button>
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
      <div class="text-center text-muted small">Page {{ currentPage }} sur {{ totalPages }} ({{ filteredPoints.length }} résultats)</div>
    </nav>

    <!-- Modal -->
    <transition name="modal-slide">
      <div v-if="showForm" class="modal-backdrop" @click.self="cancel">
        <div class="modal-content">
          <button type="button" class="close-btn" @click="cancel">&times;</button>
          <h5 class="mb-3">{{ editingId ? 'Modifier point' : 'Ajouter point' }}</h5>
          <form @submit.prevent="save">
            <div class="row">
              <div class="col-md-4 mb-3">
                <label class="form-label">Waste Type</label>
                <select v-model="form.wasteType" class="form-select">
                  <option value="plastique">Plastique</option>
                  <option value="organique">Organique</option>
                  <option value="verre">Verre</option>
                  <option value="papier">Papier</option>
                </select>
              </div>

              <div class="col-md-4 mb-3">
                <label class="form-label">Capacity (L)</label>
                <input v-model.number="form.capacityLiters" type="number" min="0" :max="form.maxCapacityLiters" class="form-control" />
              </div>

              <div class="col-md-4 mb-3">
                <label class="form-label">Max Capacity (L)</label>
                <input v-model.number="form.maxCapacityLiters" type="number" min="0" class="form-control" />
              </div>
            </div>

            <div class="row mb-3">
              <div class="col-12">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="small text-muted">Ou choisissez sur la carte :</div>
                  <div>
                    <button type="button" class="btn btn-outline-primary btn-sm me-2" @click.prevent="openMapPicker">
                      Ouvrir la carte
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" @click.prevent="clearCoordinates">Effacer</button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Reusable modal-based map picker -->
            <MapPickerModal v-model:show="showMapPicker" :initialLat="form.latitude" :initialLng="form.longitude" mapHeight="360px" @picked="onCoordinatePicked" />

            <div class="row">
              <div class="col-md-6 mb-3">
                <label class="form-label">Latitude</label>
                <input v-model.number="form.latitude" class="form-control" />
              </div>

              <div class="col-md-6 mb-3">
                <label class="form-label">Longitude</label>
                <input v-model.number="form.longitude" class="form-control" />
              </div>
            </div>

            <div class="d-flex gap-2">
              <button class="btn btn-success" type="submit">Enregistrer</button>
              <button class="btn btn-secondary" type="button" @click="cancel">Annuler</button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from "../layouts/DashboardLayout.vue"
import MapPickerModal from '../components/MapPickerModal.vue'
import collecteService from "../services/CollectPointService.js"
import authService from "../services/auth.service.js"
import { ref, onMounted, onBeforeUnmount, computed } from "vue"

const points = ref([])
const showForm = ref(false)
const editingId = ref(null)
const searchQuery = ref('')
const statusFilter = ref('')
const wasteTypeFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const form = ref({
  wasteType: 'plastique',
  capacityLiters: 0,
  maxCapacityLiters: 0,
  status: 'NORMAL',
  latitude: null,
  longitude: null
})

const showMapPicker = ref(false)

const isStaff = computed(() => authService.hasRole('ADMIN', 'EMPLOYE'))

const filteredPoints = computed(() => {
  const list = !searchQuery.value ? points.value : points.value.filter(p => {
    const query = searchQuery.value.toLowerCase()
    const wasteType = (p.wasteType || '').toLowerCase()
    const status = computeStatus(p).toLowerCase()
    const coords = `${formatCoordinate(p.latitude)},${formatCoordinate(p.longitude)}`.toLowerCase()
    return wasteType.includes(query) || status.includes(query) || coords.includes(query)
  })
  // Inverser l'ordre pour afficher les nouveaux en haut
  return [...list].reverse()
})

const totalPages = computed(() => Math.ceil(filteredPoints.value.length / itemsPerPage))

const paginatedPoints = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredPoints.value.slice(start, end)
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

async function load() {
  try {
    let res
    if (statusFilter.value) {
      res = await collecteService.getByStatus(statusFilter.value)
    } else if (wasteTypeFilter.value) {
      res = await collecteService.getByWasteType(wasteTypeFilter.value)
    } else {
      res = await collecteService.getAll()
    }
    points.value = res.data || []
  } catch (e) {
    points.value = []
  }
}

onMounted(load)

function onFiltersChange() {
  // Reset to first page and fetch server-side filtered data
  currentPage.value = 1
  load()
}

function clearServerFilters() {
  statusFilter.value = ''
  wasteTypeFilter.value = ''
  currentPage.value = 1
  load()
}

function openAdd() {
  editingId.value = null
  form.value = {
    wasteType: 'plastique',
    capacityLiters: 0,
    maxCapacityLiters: 0,
    status: 'NORMAL',
    latitude: null,
    longitude: null
  }
  showForm.value = true
}

function openEdit(p) {
  editingId.value = p.id
  form.value = {
    wasteType: p.wasteType || '',
    capacityLiters: p.capacityLiters ?? 0,
    maxCapacityLiters: p.maxCapacityLiters ?? 0,
    status: p.status || 'NORMAL',
    latitude: p.latitude || null,
    longitude: p.longitude || null,
  }
  showForm.value = true
}

function cancel() {
  showForm.value = false
  showMapPicker.value = false
}

async function save() {
  try {
    if (form.value.capacityLiters > form.value.maxCapacityLiters) {
      alert(`La capacité actuelle (${form.value.capacityLiters} L) ne peut pas dépasser la capacité maximale (${form.value.maxCapacityLiters} L).`)
      return
    }

    const payload = {
      wasteType: form.value.wasteType,
      capacityLiters: form.value.capacityLiters,
      maxCapacityLiters: form.value.maxCapacityLiters,
      latitude: roundCoordinate(form.value.latitude),
      longitude: roundCoordinate(form.value.longitude)
    }

    if (editingId.value)
      await collecteService.update(editingId.value, payload)
    else
      await collecteService.create(payload)

    await load()
    showForm.value = false
  } catch (e) {
    console.error('CollectPoints save error:', e)
    const msg = e?.response?.data?.message || e?.message || 'Erreur lors de la sauvegarde'
    alert(msg)
  }
}

function openMapPicker() {
  showMapPicker.value = true
}

function clearCoordinates() {
  form.value.latitude = null
  form.value.longitude = null
}

function onCoordinatePicked(payload) {
  // payload: { latitude, longitude } - maybe nulls
  form.value.latitude = typeof payload.latitude === 'number' ? roundCoordinate(payload.latitude) : null
  form.value.longitude = typeof payload.longitude === 'number' ? roundCoordinate(payload.longitude) : null
}

function roundCoordinate(value) {
  if (value === null || value === undefined) return null
  return Math.round(value * 1000000) / 1000000
}

function formatCoordinate(value) {
  if (value === null || value === undefined) return '-'
  // Supprimer les zéros inutiles à droite
  return parseFloat(value.toFixed(6)).toString()
}

function formatNiveau(p) {
  if (p.niveau != null) {
    return p.niveau.toFixed(2) + '%'
  }
  // Calcul côté client si le backend n'a pas envoyé le niveau
  if (p.capacityLiters == null || p.maxCapacityLiters == null || p.maxCapacityLiters === 0) return '-'
  const niveau = (p.capacityLiters / p.maxCapacityLiters) * 100
  return niveau.toFixed(2) + '%'
}

let updateInterval = null
const simulationRunning = ref(false)

function startRealtimeUpdate() {
  // prevent multiple starts
  if (updateInterval) return
  simulationRunning.value = true

  updateInterval = setInterval(async () => {
    // Mise à jour aléatoire des points
    for (const p of points.value) {
      if (Math.random() < 0.5) continue // 50% chance de mise à jour
      const current = p.capacityLiters || 0
      const max = p.maxCapacityLiters || 0
      if (current >= max) continue

      // Augmentation aléatoire petite pour l'effet progressif
      const increase = Math.random() * (max - current) * 0.05 // max 5% du restant
      const newCapacity = Math.min(current + increase, max)
      p.capacityLiters = Math.round(newCapacity)

      // Persistance (non bloquante)
      collecteService.update(p.id, { ...p, capacityLiters: p.capacityLiters })
        .catch(e => console.error("Erreur API :", e))
    }
  }, 1000) // update toutes les 1 seconde
}

function stopRealtimeUpdate() {
  if (!updateInterval) return
  clearInterval(updateInterval)
  updateInterval = null
  simulationRunning.value = false
}

onBeforeUnmount(() => {
  if (updateInterval) clearInterval(updateInterval)
})

function computeStatus(p) {
  if (p.capacityLiters == null || p.maxCapacityLiters == null || p.maxCapacityLiters === 0) return '-'
  const ratio = (p.capacityLiters / p.maxCapacityLiters) * 100
  if (ratio === 0) return 'VIDE'
  if (ratio <= 50) return 'NORMAL'
  if (ratio <= 80) return 'PRESQUE_PLEIN'
  return 'PLEIN'
}
async function updateRandomCapacities() {
  try {
    for (const p of points.value) {
      if (Math.random() < 0.5) continue; // 50% de chance de mise à jour

      const current = p.capacityLiters || 0
      const max = p.maxCapacityLiters || 0
      if (current >= max) continue

      // Générer une augmentation aléatoire
      const increase = Math.random() * (max - current)
      const newCapacity = Math.min(current + increase, max)

      // Mettre à jour la capacité localement pour affichage immédiat
      p.capacityLiters = Math.round(newCapacity)
      
      // Appel API pour sauvegarder en base, mais pas obligé d'attendre
      collecteService.update(p.id, { ...p, capacityLiters: p.capacityLiters })
        .catch(e => console.error("Erreur API :", e))
    }
  } catch (e) {
    console.error('CollectPoints update error:', e)
    const msg = e?.response?.data?.message || e?.message || 'Erreur lors de la mise à jour'
    alert(msg)
  }
}

async function remove(id) {
  if (!confirm('Supprimer ce point ?')) return
  try {
    await collecteService.delete(id)
    await load()
  } catch (e) {
    console.error('CollectPoints delete error:', e)
    const msg = e?.response?.data?.message || e?.message || 'Erreur lors de la suppression'
    alert(msg)
  }
}


</script>

<style scoped>
.table td,
.table th {
  vertical-align: middle;
}

/* Modal centré */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 500px;
  max-width: 95%;
  box-shadow: 0 0 15px rgba(0,0,0,0.3);
  position: relative;
}

.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
}

/* Fade + scale animation */
.modal-slide-enter-active,
.modal-slide-leave-active {
  transition: all 0.3s ease;
}
.modal-slide-enter-from {
  opacity: 0;
  transform: scale(0.8);
}
.modal-slide-enter-to {
  opacity: 1;
  transform: scale(1);
}
.modal-slide-leave-from {
  opacity: 1;
  transform: scale(1);
}
.modal-slide-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>