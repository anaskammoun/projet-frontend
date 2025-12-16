<template>
  <div class="d-flex">
    <SideBar />

    <div class="flex-grow-1 main-content">

      <NavBar />

      <main class="p-4">
        <h2 class="fw-bold text-primary mb-4">Tableau de bord</h2>

        <!-- Main KPIs -->
        <div class="row g-4 mb-5">
          <div class="col-md-3" v-for="card in mainCards" :key="card.title">
            <DataCard 
              :title="card.title" 
              :value="card.value" 
              class="shadow-sm border-0 rounded-3"
            />
          </div>
        </div>

        <!-- Stats row -->
        <div class="row g-4 mb-5">
          <!-- Points par statut -->
          <div class="col-lg-6">
            <div class="card h-100 shadow-sm rounded-3 p-4">
              <h5 class="fw-bold mb-3 text-secondary">Points de collecte par statut</h5>
              <ul class="list-unstyled mt-2">
                <li v-for="s in pointsByStatus" :key="s.status" class="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div class="d-flex align-items-center">
                    <span :class="['status-dot me-2', statusClass(s.status)]"></span>
                    <strong class="text-dark">{{ s.status }}</strong>
                  </div>
                  <span class="badge bg-gradient-primary rounded-pill px-3 py-1">{{ s.count }}</span>
                </li>
                <li v-if="pointsByStatus.length === 0" class="text-muted">Aucun point trouvé.</li>
              </ul>
            </div>
          </div>

          <!-- Points par type de déchet -->
          <div class="col-lg-6">
            <div class="card h-100 shadow-sm rounded-3 p-4">
              <h5 class="fw-bold mb-3 text-secondary">Points par type de déchet</h5>
              <ul class="list-unstyled mt-2">
                <li v-for="c in pointsByType" :key="c.type" class="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <strong class="text-dark">{{ c.type }}</strong>
                  <span class="badge bg-gradient-primary rounded-pill px-3 py-1">{{ c.count }}</span>
                </li>
                <li v-if="pointsByType.length === 0" class="text-muted">Aucun point trouvé.</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Map -->
        <div class="card shadow-sm rounded-3">
          <div class="card-body p-3">
            <MapView />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import SideBar from './SideBar.vue'
import NavBar from './NavBar.vue'
import Footer from './Footer.vue'
import DataCard from './DataCard.vue'
import MapView from './MapView.vue'
import collecteService from '../services/CollectPointService.js'
import VehicleService from '../services/VehicleService.js'
import EmployeeService from '../services/EmployeeService.js'
import TourService from '../services/TourService.js'

const mainCards = ref([
  { title: 'Points de collecte', value: '—' },
  { title: 'Véhicules disponibles', value: '—' },
  { title: 'Employés disponibles', value: '—' },
  { title: 'Tournées en cours', value: '—' }
])

const pointsByStatus = ref([])
const pointsByType = ref([])

function statusClass(status) {
  const map = {
    'PLEIN': 'bg-danger',
    'PRESQUE_PLEIN': 'bg-warning',
    'NORMAL': 'bg-success',
    'VIDE': 'bg-secondary'
  }
  return map[status] || 'bg-secondary'
}

async function loadData() {
  const [pointsRes, vehiclesRes, employeesRes, statsRes] = await Promise.allSettled([
    collecteService.getAll(),
    VehicleService.getAll(),
    EmployeeService.getAll(),
    TourService.getStats()
  ])

  const points = pointsRes.status === 'fulfilled' ? pointsRes.value.data : []
  const vehicles = vehiclesRes.status === 'fulfilled' ? vehiclesRes.value.data : []
  const employees = employeesRes.status === 'fulfilled' ? employeesRes.value.data : []
  const stats = statsRes.status === 'fulfilled' ? statsRes.value.data : null

  // Main cards
  mainCards.value[0].value = points.length
  mainCards.value[1].value = vehicles.filter(v => v.available).length
  mainCards.value[2].value = employees.filter(e => e.available).length
  mainCards.value[3].value = stats?.inProgressCount ?? 0

  // Points par statut
  const statusCounts = {}
  points.forEach(p => {
    const s = p.status || 'INCONNU'
    statusCounts[s] = (statusCounts[s] || 0) + 1
  })
  const statusOrder = ['PLEIN', 'PRESQUE_PLEIN', 'NORMAL', 'VIDE']
  pointsByStatus.value = statusOrder
    .filter(s => statusCounts[s])
    .map(s => ({ status: s, count: statusCounts[s] }))

  // Points par type de déchet
  const typeCounts = {}
  points.forEach(p => {
    const t = p.wasteType || 'Autre'
    typeCounts[t] = (typeCounts[t] || 0) + 1
  })
  pointsByType.value = Object.keys(typeCounts)
    .map(t => ({ type: t, count: typeCounts[t] }))
    .sort((a, b) => b.count - a.count)
}

onMounted(loadData)
</script>
<style scoped>
.main-content {
  margin-left: 320px;
}

.card {
  border-radius: 12px;
}

.badge {
  font-size: 0.9rem;
}

.border-bottom {
  border-bottom: 1px solid #e9ecef;
}

.bg-gradient-primary {
  background: linear-gradient(135deg,#0d6efd, #0d6efd);
  color: #fff;
}

.shadow-sm {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}
</style>
