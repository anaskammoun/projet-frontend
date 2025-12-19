<template>
  <EmployeLayout>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="page-title mb-0">Mes Tournées</h2>
      <router-link to="/logout" class="btn btn-outline-danger btn-sm">Déconnexion</router-link>
    </div>

    <div class="alert alert-info mb-3" v-if="!me">
      Identité employé non détectée. Configurez Nginx pour envoyer l'en-tête <code>X-Employee-Cin</code> ou <code>X-Employee-Id</code>.
    </div>

    <!-- Carte / aperçu de la tournée sélectionnée -->
    <div class="card shadow-sm mb-3">
      <div class="card-body p-3">
        <MapView :routePoints="routePoints" :routeVehicle="routeVehicle" />
      </div>
    </div>

    <!-- Filtres rapides -->
    <div class="card shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-4">
            <label class="form-label">Filtrer par statut</label>
            <select v-model="statusFilter" class="form-select">
              <option value="">Tous</option>
              <option value="planifiée">Planifiée</option>
              <option value="en cours">En cours</option>
              <option value="terminée">Terminée</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Recherche</label>
            <input v-model="searchQuery" type="text" class="form-control" placeholder="Véhicule, statut ou date" />
          </div>
          <div class="col-md-4 text-end">
            <button class="btn btn-outline-secondary" @click="reload">Rafraîchir</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des tournées -->
    <div class="card shadow-sm">
      <div class="card-body">
        <div class="text-muted mb-3" v-if="me">
          <span class="label">Employé</span>
          <span class="pill">{{ me.cin || me.id }}</span>
        </div>
        <div v-if="paginated.length === 0" class="text-muted">Aucune tournée trouvée.</div>
        <table v-else class="table table-striped">
          <thead>
            <tr>
              <th>Date</th>
              <th>Véhicule</th>
              <th>Statut</th>
              <th>Distance (km)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in paginated" :key="t.id">
              <td>{{ formatDate(t.date) }}</td>
              <td>{{ t.vehicleData ? `${t.vehicleData.matricule} — ${t.vehicleData.type}` : '-' }}</td>
              <td>
                <span class="badge" :class="statusClass(t.status)">{{ t.status || '-' }}</span>
              </td>
              <td>{{ formatDistance(t.estimatedDistance) }}</td>
              <td>
                <button class="btn btn-sm btn-info" @click="showOnMap(t)">Afficher</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination simple -->
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
          <div class="text-center text-muted small">Page {{ currentPage }} sur {{ totalPages }} ({{ filtered.length }} résultats)</div>
        </nav>
      </div>
    </div>
  </EmployeLayout>
  
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import EmployeLayout from '../layouts/EmployeLayout.vue'
import MapView from '../components/MapView.vue'
import EmployeeService from '../services/EmployeeService.js'
import TourService from '../services/TourService.js'

const router = useRouter()

const tours = ref([])
const me = ref(null)
const statusFilter = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 8
const routePoints = ref([])
const routeVehicle = ref(null)

const filtered = computed(() => {
  if (!me.value) return []
  let list = tours.value.filter(t => hasEmployee(t, me.value.id) || hasEmployee(t, me.value.cin))
  if (statusFilter.value) {
    list = list.filter(t => (t.status || '').toLowerCase() === statusFilter.value.toLowerCase())
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(t => {
      const veh = t.vehicleData ? `${t.vehicleData.matricule} ${t.vehicleData.type}`.toLowerCase() : ''
      const st = (t.status || '').toLowerCase()
      const dateStr = formatDate(t.date).toLowerCase()
      return veh.includes(q) || st.includes(q) || dateStr.includes(q)
    })
  }
  return [...list].reverse()
})

const totalPages = computed(() => Math.ceil(filtered.value.length / itemsPerPage))
const paginated = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filtered.value.slice(start, start + itemsPerPage)
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

function hasEmployee(tour, empId) {
  // Support both embedded objects and id lists
  const emb = Array.isArray(tour.employeesData) ? tour.employeesData : []
  const ids = Array.isArray(tour.employees) ? tour.employees : []
  if (emb.some(e => e.id === empId || e.cin === empId)) return true
  if (ids.includes(empId)) return true
  return false
}

function formatDate(ts) {
  if (!ts) return '-'
  const d = new Date(Number(ts))
  return d.toLocaleString()
}
function formatDistance(d) {
  if (d == null) return '-'
  const n = Number(d)
  return Number.isNaN(n) ? '-' : n.toFixed(2)
}

function statusClass(s) {
  const v = (s || '').toLowerCase()
  if (v.includes('plan')) return 'badge-planifiee'
  if (v.includes('cours')) return 'badge-en-cours'
  if (v.includes('term')) return 'badge-terminee'
  return 'badge-inconnu'
}

async function reload() {
  const [meRes, tRes] = await Promise.allSettled([
    EmployeeService.getMe(),
    TourService.getAll()
  ])
  me.value = meRes.status === 'fulfilled' ? meRes.value.data : null
  tours.value = tRes.status === 'fulfilled' ? tRes.value.data : []
  currentPage.value = 1
}

onMounted(reload)

function showOnMap(t) {
  routePoints.value = (t.collectPointsData || []).map(p => ({
    id: p.id,
    latitude: p.latitude,
    longitude: p.longitude
  }))
  routeVehicle.value = t.vehicleData || null
}
</script>

<style scoped>
.page-title {
  background: linear-gradient(90deg, #4a90e2 0%, #7fb0f0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.label {
  color: var(--color-muted);
  margin-right: 0.5rem;
}
.pill {
  background: #eef5ff;
  color: #275fab;
  border-radius: 999px;
  padding: 0.2rem 0.6rem;
  font-weight: 600;
}

.badge {
  border-radius: 999px;
  font-weight: 600;
  padding: 0.35rem 0.7rem;
  font-size: 0.85rem;
}
.badge-planifiee { background: #e8f2ff; color: #1f6fd6; }
.badge-en-cours  { background: #fff5e6; color: #b35e00; }
.badge-terminee  { background: #e8fff0; color: #1a8a4a; }
.badge-inconnu   { background: #f0f2f5; color: #667085; }

.pagination .page-link {
  border: none;
  margin: 0 2px;
  border-radius: 8px;
  color: #275fab;
}
.pagination .page-item.active .page-link {
  background: #275fab;
  color: #fff;
}
.pagination .page-item.disabled .page-link {
  opacity: 0.5;
}
</style>
