<template>
  <CitoyenLayout>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="page-title mb-0">Informations Publiques</h2>
      <button class="btn btn-outline-secondary" @click="load">Rafraîchir</button>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <DataCard title="Points de collecte" :value="pointsCount" />
      </div>
      <div class="col-md-4">
        <DataCard title="Tournées aujourd'hui" :value="todayTours" />
      </div>
      <div class="col-md-4">
        <DataCard title="Tournées en cours" :value="inProgress" />
      </div>
    </div>

    <!-- Carte générale -->
    <div class="card shadow-sm mb-3">
      <div class="card-body p-3">
        <MapView />
      </div>
    </div>

    <!-- Filtres côté client -->
    <div class="card shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Filtrer par statut</label>
            <select v-model="statusFilter" class="form-select">
              <option value="">Tous</option>
              <option value="PLEIN">PLEIN</option>
              <option value="PRESQUE_PLEIN">PRESQUE_PLEIN</option>
              <option value="NORMAL">NORMAL</option>
              <option value="VIDE">VIDE</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Type de déchet</label>
            <select v-model="typeFilter" class="form-select">
              <option value="">Tous</option>
              <option v-for="t in allTypes" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Recherche</label>
            <input v-model="searchQuery" type="text" class="form-control" placeholder="Type ou statut" />
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <div class="col-lg-6">
        <div class="card h-100 shadow-sm p-3">
          <h5 class="card-title mb-3">Répartition des points par statut</h5>
          <ul class="list-unstyled">
            <li v-for="s in filteredByStatus" :key="s.status" class="stat-item d-flex justify-content-between py-2">
              <span class="stat-label">
                <span class="dot" :class="statusDotClass(s.status)"></span>
                {{ s.status }}
              </span>
              <span class="badge" :class="statusBadgeClass(s.status)">{{ s.count }}</span>
            </li>
            <li v-if="filteredByStatus.length===0" class="text-muted">—</li>
          </ul>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card h-100 shadow-sm p-3">
          <h5 class="card-title mb-3">Types de déchets</h5>
          <ul class="list-unstyled">
            <li v-for="t in filteredByType" :key="t.type" class="stat-item d-flex justify-content-between py-2">
              <span class="stat-label">
                <span class="dot type"></span>
                {{ t.type }}
              </span>
              <span class="badge badge-type">{{ t.count }}</span>
            </li>
            <li v-if="filteredByType.length===0" class="text-muted">—</li>
          </ul>
        </div>
      </div>
    </div>
  </CitoyenLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import CitoyenLayout from '../layouts/CitoyenLayout.vue'
import DataCard from '../components/DataCard.vue'
import MapView from '../components/MapView.vue'
import CollectPointService from '../services/CollectPointService.js'
import TourService from '../services/TourService.js'

const pointsCount = ref('—')
const inProgress = ref('—')
const todayTours = ref('—')
const pointsByStatus = ref([])
const pointsByType = ref([])
const statusFilter = ref('')
const typeFilter = ref('')
const searchQuery = ref('')
const allTypes = ref([])

async function load() {
  const [pRes, statsRes, tRes] = await Promise.allSettled([
    CollectPointService.getAll(),
    TourService.getStats(),
    TourService.getAll()
  ])
  const points = pRes.status==='fulfilled' ? pRes.value.data : []
  const stats = statsRes.status==='fulfilled' ? statsRes.value.data : null
  const tours = tRes.status==='fulfilled' ? tRes.value.data : []

  pointsCount.value = points.length
  inProgress.value = stats?.inProgressCount ?? 0

  const today = new Date()
  today.setHours(0,0,0,0)
  todayTours.value = tours.filter(t => {
    const d = t.date ? new Date(Number(t.date)) : null
    if (!d) return false
    d.setHours(0,0,0,0)
    return d.getTime() === today.getTime()
  }).length

  const statusCounts = {}
  points.forEach(p => {
    const s = p.status || 'INCONNU'
    statusCounts[s] = (statusCounts[s]||0)+1
  })
  pointsByStatus.value = Object.keys(statusCounts).map(k => ({ status:k, count:statusCounts[k] }))

  const typeCounts = {}
  points.forEach(p => {
    const t = p.wasteType || 'Autre'
    typeCounts[t] = (typeCounts[t]||0)+1
  })
  pointsByType.value = Object.keys(typeCounts).map(k => ({ type:k, count:typeCounts[k] }))
  allTypes.value = Object.keys(typeCounts)
}

onMounted(load)

const filteredByStatus = computed(() => {
  // Apply filters to status distribution
  let list = pointsByStatus.value
  if (statusFilter.value) list = list.filter(s => s.status === statusFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => s.status.toLowerCase().includes(q))
  }
  return list
})

const filteredByType = computed(() => {
  let list = pointsByType.value
  if (typeFilter.value) list = list.filter(t => t.type === typeFilter.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(t => t.type.toLowerCase().includes(q))
  }
  return list
})

function statusBadgeClass(s) {
  switch ((s||'').toUpperCase()) {
    case 'PLEIN': return 'badge-danger'
    case 'PRESQUE_PLEIN': return 'badge-warning'
    case 'NORMAL': return 'badge-success'
    case 'VIDE': return 'badge-info'
    default: return 'badge-muted'
  }
}
function statusDotClass(s) {
  switch ((s||'').toUpperCase()) {
    case 'PLEIN': return 'dot-danger'
    case 'PRESQUE_PLEIN': return 'dot-warning'
    case 'NORMAL': return 'dot-success'
    case 'VIDE': return 'dot-info'
    default: return 'dot-muted'
  }
}
</script>

<style scoped>
.page-title {
  background: linear-gradient(90deg, #4a90e2 0%, #7fb0f0 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.card-title {
  color: #275fab;
  font-weight: 700;
}
.stat-item + .stat-item { border-top: 1px solid #eef1f4; }
.stat-label { display: inline-flex; align-items: center; gap: 8px; }
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #cbd5e1;
}
.dot-danger  { background: #ef4444; }
.dot-warning { background: #f59e0b; }
.dot-success { background: #22c55e; }
.dot-info    { background: #3b82f6; }
.dot-muted   { background: #94a3b8; }

.badge {
  border-radius: 999px;
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  font-size: 0.85rem;
}
.badge-danger  { background: #fee2e2; color: #b91c1c; }
.badge-warning { background: #ffedd5; color: #b45309; }
.badge-success { background: #dcfce7; color: #166534; }
.badge-info    { background: #dbeafe; color: #1e40af; }
.badge-muted   { background: #f1f5f9; color: #334155; }
.badge-type    { background: #eef5ff; color: #275fab; }
</style>
