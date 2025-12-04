<template>
  <DashboardLayout>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Employés</h2>
      <button type="button" class="btn btn-primary" @click="openAdd">Ajouter</button>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <!--<th>Rôle</th>-->
          <th>Compétence</th>
          <th>Disponible</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="e in employees" :key="e.id">
          <td>{{ e.name }}</td>
          <td>{{ e.role }}</td>
          <!--<td>{{ (e.skills || []).join(', ') }}</td>-->
          <td>{{ e.available ? 'Oui' : 'Non' }}</td>
          <td>
            <button type="button" class="btn btn-sm btn-warning me-1" @click="openEdit(e)">Modifier</button>
            <button type="button" class="btn btn-sm btn-danger" @click="remove(e.id)">Supprimer</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal -->
    <transition name="modal-slide">
      <div v-if="showForm" class="modal-backdrop" @click.self="cancel">
        <div class="modal-content">
          <button type="button" class="close-btn" @click="cancel">&times;</button>
          <h5 class="mb-3">{{ editingId ? 'Modifier employé' : 'Ajouter employé' }}</h5>
          <form @submit.prevent="save">
            <div class="mb-3">
              <label class="form-label">Nom</label>
              <input v-model="form.name" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Compétence</label>
              <input v-model="form.role" class="form-control" />
            </div>
            <!--
            <div class="mb-3">
              <label class="form-label">Compétences (séparées par des virgules)</label>
              <input v-model="form.skillsText" class="form-control" placeholder="tri, conduite, nettoyage" />
            </div>
            -->
            <div class="mb-3 form-check">
              <input id="empAvailable" v-model="form.available" type="checkbox" class="form-check-input" />
              <label for="empAvailable" class="form-check-label">Disponible</label>
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
  form.value = { 
    name: e.name || '', 
    role: e.role || '', 
    skillsText: (e.skills || []).join(', '), 
    available: e.available === undefined ? true : e.available
  }
  showForm.value = true
}

function cancel() {
  showForm.value = false
}

async function save() {
  try {
    const payload = {
      name: form.value.name,
      role: form.value.role,
      skills: form.value.skillsText
        ? form.value.skillsText.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      available: !!form.value.available
    }
    if (editingId.value) await EmployeeService.update(editingId.value, payload)
    else await EmployeeService.create(payload)
    await load()
    showForm.value = false
  } catch (e) {
    console.error('Employee save error:', e)
    const msg = e?.response?.data?.message || e?.message || 'Erreur lors de la sauvegarde'
    alert(msg)
  }
}

async function remove(id) {
  if (!confirm('Supprimer cet employé ?')) return
  try {
    await EmployeeService.delete(id)
    await load()
  } catch (e) {
    console.error('Employee delete error:', e)
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
  align-items: center; /* <-- centré verticalement */
  z-index: 9999;
  padding: 1rem;
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

/* Bouton de fermeture */
.close-btn {
  position: absolute;
  top: 0.5rem;
  right: 1rem;
  border: none;
  background: transparent;
  font-size: 1.5rem;
  cursor: pointer;
}

/* Fade + zoom (pour modal centré) */
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
