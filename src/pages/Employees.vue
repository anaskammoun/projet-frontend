<template>
  <DashboardLayout>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2>Employés</h2>
      <button type="button" class="btn btn-primary" @click="openAdd">Ajouter</button>
    </div>

    <!-- Barre de recherche -->
    <div class="mb-3">
      <input v-model="searchQuery" type="text" class="form-control" placeholder="Rechercher par nom, prénom, CIN ou compétence..." />
    </div>

    <!-- Filtre serveur par disponibilité -->
    <div class="row g-3 mb-3">
      <div class="col-md-4">
        <label class="form-label">Filtrer par disponibilité</label>
        <select v-model.boolean="availableFilter" class="form-select" @change="onAvailableFilterChange">
          <option :value="null">Tous</option>
          <option :value="true">Disponible</option>
          <option :value="false">Indisponible</option>
        </select>
      </div>
      <div class="col-md-8 d-flex align-items-end">
        <button type="button" class="btn btn-outline-secondary me-2" @click="clearAvailableFilter">Réinitialiser</button>
      </div>
    </div>

    <table class="table table-striped">
      <thead>
        <tr>
          <th>Nom</th>
          <th>Prénom</th>
          <th>CIN</th>
          <th>Compétences</th>
          <th>Disponible</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="paginatedEmployees.length === 0">
          <td colspan="6" class="text-center text-muted">Aucun employé trouvé</td>
        </tr>
        <tr v-for="e in paginatedEmployees" :key="e.id">
          <td>{{ e.name }}</td>
          <td>{{ e.prenom || '-' }}</td>
          <td>{{ e.cin || '-' }}</td>
          <td>{{ (e.skills || []).join(', ') || '-' }}</td>
          <td>{{ e.available ? 'Oui' : 'Non' }}</td>
          <td>
            <button type="button" class="btn btn-sm btn-warning me-1" @click="openEdit(e)">Modifier</button>
            <button type="button" class="btn btn-sm btn-danger" @click="remove(e.id)">Supprimer</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Pagination -->
    <nav v-if="totalPages > 1" aria-label="Pagination">
      <ul class="pagination justify-content-center">
        <li class="page-item" :class="{ disabled: currentPage === 1 }">
          <a class="page-link" href="#" @click.prevent="currentPage = Math.max(1, currentPage - 1)">Précédent</a>
        </li>
        <li v-for="p in totalPages" :key="p" class="page-item" :class="{ active: p === currentPage }">
          <a class="page-link" href="#" @click.prevent="currentPage = p">{{ p }}</a>
        </li>
        <li class="page-item" :class="{ disabled: currentPage === totalPages }">
          <a class="page-link" href="#" @click.prevent="currentPage = Math.min(totalPages, currentPage + 1)">Suivant</a>
        </li>
      </ul>
    </nav>

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
              <label class="form-label">Prénom</label>
              <input v-model="form.prenom" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">CIN</label>
              <input v-model="form.cin" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Compétences (séparées par des virgules)</label>
              <input v-model="form.skillsText" class="form-control" placeholder="conducteur, agent de collecte, tri, nettoyage" required />
            </div>
            
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
import { ref, onMounted, computed } from 'vue'

const employees = ref([])
const showForm = ref(false)
const editingId = ref(null)
const form = ref({ name: '', cin: '', skillsText: '', available: true })

// Recherche et pagination
const searchQuery = ref('')
const availableFilter = ref(null)
const currentPage = ref(1)
const itemsPerPage = 10

const filteredEmployees = computed(() => {
  if (!searchQuery.value) return employees.value
  const query = searchQuery.value.toLowerCase()
  return employees.value.filter(e => 
    (e.name || '').toLowerCase().includes(query) ||
    (e.prenom || '').toLowerCase().includes(query) ||
    (e.cin || '').toLowerCase().includes(query) ||
    (e.skills || []).some(skill => skill.toLowerCase().includes(query))
  )
})

const totalPages = computed(() => Math.ceil(filteredEmployees.value.length / itemsPerPage))

const paginatedEmployees = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredEmployees.value.slice(start, end)
})

async function load() {
  try {
    let res
    if (availableFilter.value !== null) {
      res = await EmployeeService.getByAvailable(availableFilter.value)
    } else {
      res = await EmployeeService.getAll()
    }
    employees.value = res.data || []
  } catch (e) {
    employees.value = []
  }
}

function loadEmployees() {
  currentPage.value = 1
  load()
}

function onAvailableFilterChange() {
  currentPage.value = 1
  loadEmployees()
}

function clearAvailableFilter() {
  availableFilter.value = null
  currentPage.value = 1
  loadEmployees()
}

onMounted(load)

function openAdd() {
  editingId.value = null
  form.value = { name: '', prenom: '', cin: '', skillsText: '', available: true }
  showForm.value = true
}

function openEdit(e) {
  editingId.value = e.id
  form.value = { 
    name: e.name || '', 
    prenom: e.prenom || '',
    cin: e.cin || '',
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
      prenom: form.value.prenom,
      cin: form.value.cin,
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
