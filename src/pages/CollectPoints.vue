<template>
  <DashboardLayout>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Points de collecte</h2>
      <div>
        <button class="btn btn-primary" @click="openAdd">Ajouter</button>
      </div>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Waste Type</th>
          <th>Fill Level</th>
          <th>Status</th>
          <th>Coordonnées</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in points" :key="p.id">
          <td>{{ p.wasteType || '-' }}</td>
          <td>{{ (p.fillLevel ?? '-') + (typeof p.fillLevel === 'number' ? '%' : '') }}</td>
          <td>{{ p.status || '-' }}</td>
          <td>{{ p.latitude ?? '-' }}, {{ p.longitude ?? '-' }}</td>
          <td>
            <button class="btn btn-sm btn-warning me-1" @click="openEdit(p)">Modifier</button>
            <button class="btn btn-sm btn-danger" @click="remove(p.id)">Supprimer</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showForm" class="card mt-4 p-3">
      <h5>{{ editingId ? 'Modifier point' : 'Ajouter point' }}</h5>
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
            <label class="form-label">Fill Level (%)</label>
            <input v-model.number="form.fillLevel" type="number" min="0" max="100" class="form-control" />
          </div>
          <div class="col-md-4 mb-3">
            <label class="form-label">Status</label>
            <select v-model="form.status" class="form-select">
              <option value="VIDE">VIDE</option>
              <option value="NORMAL">NORMAL</option>
              <option value="PRESQUE_PLEIN">PRESQUE_PLEIN</option>
              <option value="PLEIN">PLEIN</option>
              <option value="EN_MAINTENANCE">EN_MAINTENANCE</option>
            </select>
          </div>
        </div>

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
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from "../layouts/DashboardLayout.vue"
import collecteService from "../services/collecte.service.js"
import { ref, onMounted } from "vue"

const points = ref([])
const showForm = ref(false)
const editingId = ref(null)
const form = ref({ wasteType: 'plastique', fillLevel: 0, status: 'NORMAL', latitude: null, longitude: null })

async function load() {
  try {
    const res = await collecteService.getAll()
    points.value = res.data || []
  } catch (e) {
    points.value = []
  }
}

onMounted(load)

function openAdd() {
  editingId.value = null
  form.value = { wasteType: 'plastique', fillLevel: 0, status: 'NORMAL', latitude: null, longitude: null }
  showForm.value = true
}

function openEdit(p) {
  editingId.value = p.id
  form.value = {
    wasteType: p.wasteType || p.type || '',
    fillLevel: p.fillLevel ?? 0,
    status: p.status || 'NORMAL',
    latitude: p.latitude || null,
    longitude: p.longitude || null,
  }
  showForm.value = true
}

function cancel() { showForm.value = false }

async function save() {
  try {
    const payload = {
      wasteType: form.value.wasteType,
      fillLevel: form.value.fillLevel,
      status: form.value.status,
      latitude: form.value.latitude,
      longitude: form.value.longitude
    }
    if (editingId.value) await collecteService.update(editingId.value, payload)
    else await collecteService.create(payload)
    await load()
    showForm.value = false
  } catch (e) {
    alert('Erreur lors de la sauvegarde')
  }
}

async function remove(id) {
  if (!confirm('Supprimer ce point ?')) return
  try {
    await collecteService.delete(id)
    await load()
  } catch (e) {
    alert('Erreur lors de la suppression')
  }
}
</script>

<style scoped>
.table td, .table th { vertical-align: middle }
</style>
