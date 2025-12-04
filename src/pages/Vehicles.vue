<template>
  <DashboardLayout>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Véhicules</h2>
      <button type="button" class="btn btn-primary" @click="openAdd">Ajouter</button>
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
        <tr v-for="v in vehicles" :key="v.id">
          <td>{{ v.matricule }}</td>
          <td>{{ v.type }}</td>
          <td>{{ v.capacity ?? '-' }}</td>
          <td>{{ v.available ? 'Oui' : 'Non' }}</td>
          <td>{{ v.latitude ?? '-' }}</td>
          <td>{{ v.longitude ?? '-' }}</td>
          <td>
            <button type="button" class="btn btn-sm btn-warning me-1" @click="openEdit(v)">Modifier</button>
            <button type="button" class="btn btn-sm btn-danger" @click="remove(v.id)">Supprimer</button>
          </td>
        </tr>
      </tbody>
    </table>

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
import { ref, onMounted } from 'vue'
import L from 'leaflet'
import MapPickerModal from '../components/MapPickerModal.vue'

let map = null
let markers = []

const vehicles = ref([])
const showForm = ref(false)
const editingId = ref(null)

const form = ref({
  matricule: '',
  type: '',
  capacity: 0,
  latitude: 0,
  longitude: 0
})

const showMapPicker = ref(false)

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
  form.value = { matricule: '', type: '', capacity: 0, available: true, latitude: 0, longitude: 0 }
  showForm.value = true
}

function openEdit(v) {
  editingId.value = v.id
  form.value = {
    matricule: v.matricule || '',
    type: v.type || '',
    capacity: v.capacity ?? 0,
    latitude: v.latitude ?? 0,
    longitude: v.longitude ?? 0
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
