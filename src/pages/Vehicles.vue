<template>
  <DashboardLayout>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Véhicules</h2>
      <button type="button" class="btn btn-primary" @click="openAdd">Ajouter</button>
    </div>

    <!-- Barre de recherche -->
    <div class="mb-3">
      <input v-model="searchQuery" type="text" class="form-control" placeholder="Rechercher par matricule, type ou disponibilité..." />
    </div>

    <table class="table table-hover">
      <thead>
        <tr>
          <th>Matricule</th>
          <th>Type</th>
          <th>Capacité (L)</th>
          <th>Disponible</th>
          <th>Latitude</th>
          <th>Longitude</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paginatedVehicles.length === 0">
          <td colspan="7" class="text-center text-muted">Aucun véhicule trouvé</td>
        </tr>
        <tr v-for="v in paginatedVehicles" :key="v.id">
          <td>{{ v.matricule }}</td>
          <td>{{ v.type }}</td>
          <td>{{ v.capacity ?? '-' }}</td>
          <td>{{ v.available ? 'Oui' : 'Non' }}</td>
          <td>{{ formatCoordinate(v.latitude) }}</td>
          <td>{{ formatCoordinate(v.longitude) }}</td>
          <td>
            <button type="button" class="btn btn-sm btn-warning me-1" @click="openEdit(v)">Modifier</button>
            <button type="button" class="btn btn-sm btn-danger" @click="remove(v.id)">Supprimer</button>
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
      <div class="text-center text-muted small">Page {{ currentPage }} sur {{ totalPages }} ({{ filteredVehicles.length }} résultats)</div>
    </nav>

    <!-- Modal -->
    <transition name="modal">
      <div v-if="showForm" class="modal-backdrop" @click.self="cancel">
        <div class="modal-content">
          <button type="button" class="close-btn" @click="cancel">&times;</button>
          <h5 class="mb-3">{{ editingId ? 'Modifier véhicule' : 'Ajouter véhicule' }}</h5>
          <form @submit.prevent="save">
            <div class="mb-3">
              <label class="form-label">Matricule</label>
              <input v-model="form.matricule" class="form-control" placeholder="Ex: 229TU5390" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Type</label>
              <select v-model="form.type" class="form-select" required>
                <option value="" disabled>-- Sélectionner un type --</option>
                <option value="Camion">Camion</option>
                <option value="Benne">Benne</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Capacité (L)</label>
              <input v-model.number="form.capacity" type="number" min="0" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Latitude</label>
              <input v-model.number="form.latitude" type="number" step="0.000001" class="form-control" />
            </div>
            <div class="mb-3">
              <label class="form-label">Longitude</label>
              <input v-model.number="form.longitude" type="number" step="0.000001" class="form-control" />
            </div>
            <div class="mb-3 d-flex gap-2">
              <button type="button" class="btn btn-outline-primary btn-sm" @click.prevent="showMapPicker = true">Ouvrir carte</button>
              <button type="button" class="btn btn-outline-secondary btn-sm" @click.prevent="clearVehicleCoords">Effacer</button>
            </div>
            <MapPickerModal v-model:show="showMapPicker" :initialLat="form.latitude" :initialLng="form.longitude" mapHeight="360px" @picked="onVehiclePicked" />
            <!-- 'Disponible' checkbox removed per request -->
            <div class="d-flex gap-2">
              <button class="btn btn-success" type="submit">Enregistrer</button>
              <button class="btn btn-secondary" type="button" @click="cancel">Annuler</button>
            </div>
          </form>
        </div>
      </div>
    </transition>

        <!--<h4 class="mt-4">Localisation des véhicules</h4>
    <div id="map" style="height: 400px; width: 100%;" class="mb-4"></div>-->

  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from '../layouts/DashboardLayout.vue'
import VehicleService from '../services/VehicleService.js'
import { ref, onMounted, computed } from 'vue'
import L from 'leaflet'
import MapPickerModal from '../components/MapPickerModal.vue'

let map = null
let markers = []

const vehicles = ref([])
const showForm = ref(false)
const editingId = ref(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const form = ref({
  matricule: '',
  type: '',
  capacity: 0,
  latitude: null,
  longitude: null
})

const showMapPicker = ref(false)

const filteredVehicles = computed(() => {
  const list = !searchQuery.value ? vehicles.value : vehicles.value.filter(v => {
    const query = searchQuery.value.toLowerCase()
    const matricule = (v.matricule || '').toLowerCase()
    const type = (v.type || '').toLowerCase()
    const disponible = v.available ? 'oui disponible' : 'non indisponible'
    return matricule.includes(query) || type.includes(query) || disponible.includes(query)
  })
  // Inverser l'ordre pour afficher les nouveaux en haut
  return [...list].reverse()
})

const totalPages = computed(() => Math.ceil(filteredVehicles.value.length / itemsPerPage))

const paginatedVehicles = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredVehicles.value.slice(start, end)
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

// create car icon for map markers
const carIconUrl = new URL('../assets/car-icon.svg', import.meta.url).href
const carIcon = L.icon({ iconUrl: carIconUrl, iconSize: [36,36], iconAnchor: [18,36], popupAnchor: [0,-36] })

async function load() {
  try {
    const res = await VehicleService.getAll()
    vehicles.value = res.data || []
  } catch (e) {
    vehicles.value = []
  }

  initMap()
  updateMarkers()
}

function initMap() {
  if (map) return
  // guard: only initialize if the #map element is present in DOM
  const el = document.getElementById('map')
  if (!el) return
  try {
    map = L.map(el).setView([34.75, 10.7], 6)
  } catch (err) {
    console.error('Failed to init leaflet map:', err)
    return
  }
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map)
}

function updateMarkers() {
  if (!map) return
  markers.forEach(m => map.removeLayer(m))
  markers = []

  vehicles.value.forEach(v => {
    if (v.latitude == null || v.longitude == null) return
    const marker = L.marker([v.latitude, v.longitude], { icon: carIcon, title: v.matricule || 'Véhicule' }).addTo(map)
    marker.bindPopup(`<b>${v.matricule}</b><br>Type: ${v.type}<br>Capacité: ${v.capacity ?? '-'}`)
    markers.push(marker)
  })
}

onMounted(load)

function openAdd() {
  editingId.value = null
  form.value = { matricule: '', type: '', capacity: 0, available: true, latitude: null, longitude: null }
  showForm.value = true
}

function openEdit(v) {
  editingId.value = v.id
  form.value = {
    matricule: v.matricule || '',
    type: v.type || '',
    capacity: v.capacity ?? 0,
    latitude: v.latitude ?? null,
    longitude: v.longitude ?? null
  }
  showForm.value = true
}

function onVehiclePicked(payload) {
  // keep consistent with collect points: missing values become null
  form.value.latitude = typeof payload.latitude === 'number' ? payload.latitude : null
  form.value.longitude = typeof payload.longitude === 'number' ? payload.longitude : null
}

function clearVehicleCoords() {
  form.value.latitude = null
  form.value.longitude = null
}

function formatCoordinate(value) {
  if (value === null || value === undefined) return '-'
  return parseFloat(value.toFixed(6)).toString()
}

function cancel() {
  showForm.value = false
}

async function save() {
  const matriculePattern = /^.+TU.+$/
  if (!matriculePattern.test(form.value.matricule)) {
    alert('Le matricule doit contenir "TU" au milieu avec au moins un caractère avant et après')
    return
  }

  try {
    // preserve availability on update; new vehicles are available by default
    let availableFlag = true
    if (editingId.value) {
      const existing = vehicles.value.find(x => x.id === editingId.value)
      availableFlag = existing && typeof existing.available === 'boolean' ? existing.available : true
    }
    const payload = { ...form.value, available: availableFlag }
    if (editingId.value) {
      await VehicleService.update(editingId.value, payload)
    } else {
      await VehicleService.create(payload)
    }
    await load()
    showForm.value = false
  } catch (e) {
    console.error('Vehicle save error:', e)
    const msg = e?.response?.data?.message || e?.message || 'Erreur lors de la sauvegarde'
    alert(msg)
  }
}

async function remove(id) {
  if (!confirm('Supprimer ce véhicule ?')) return
  try {
    await VehicleService.delete(id)
    await load()
  } catch (e) {
    console.error('Vehicle delete error:', e)
    const msg = e?.response?.data?.message || e?.message || 'Erreur lors de la suppression'
    alert(msg)
  }
}
</script>

<style scoped>
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
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  width: 400px;
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

.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from {
  opacity: 0;
  transform: scale(0.9);
}
.modal-enter-to {
  opacity: 1;
  transform: scale(1);
}
.modal-leave-from {
  opacity: 1;
  transform: scale(1);
}
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
