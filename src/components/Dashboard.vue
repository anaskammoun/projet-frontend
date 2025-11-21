<template>
  <div class="d-flex">
    <SideBar />

    <div class="flex-grow-1">
      <NavBar />

      <main class="p-4">
        <h2 class="mb-4">Tableau de bord</h2>

        <div class="row g-3 mb-4">
          <div class="col-md-4" v-for="card in cards" :key="card.title">
            <DataCard :title="card.title" :value="card.value" />
          </div>
        </div>

        <div class="row mb-4">
          <!-- Points de collecte -->
          <div class="col-lg-5 mb-3">
            <div class="card h-100 p-3">
              <h5>Répartition des points de collecte</h5>
              <ul class="list-unstyled mt-3">
                <li v-for="c in pointsByType" :key="c.type" class="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <strong>{{ c.type }}</strong>
                    <div class="text-muted small">{{ Math.round((c.count / totalPoints) * 100) }}% du total</div>
                  </div>
                  <span class="badge bg-primary rounded-pill">{{ c.count }}</span>
                </li>
                <li v-if="pointsByType.length === 0" class="text-muted">Aucun point trouvé.</li>
              </ul>
            </div>
          </div>

          <!-- Véhicules par type -->
          <div class="col-lg-7 mb-3">
            <div class="card h-100 p-3">
              <h5>Véhicules par type</h5>
              <div class="row mt-3">
                <div class="col-6" v-for="v in vehiclesByType" :key="v.type">
                  <div class="p-2 border rounded mb-2">
                    <div class="fw-bold">{{ v.type }}</div>
                    <div class="text-muted small">{{ v.count }} véhicules</div>
                  </div>
                </div>
                <div v-if="vehiclesByType.length === 0" class="text-muted">Aucun véhicule trouvé.</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Carte -->
        <div class="card">
          <div class="card-body">
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

const cards = ref([
  { title: 'Points de collecte', value: '—' },
  { title: 'Véhicules disponibles', value: '—' },
  { title: 'Employés disponibles', value: '—' }
])

const pointsByType = ref([])
const vehiclesByType = ref([])
const totalPoints = ref(0)

async function loadData() {
  const [pointsRes, vehiclesRes, employeesRes] = await Promise.allSettled([
    collecteService.getAll(),
    VehicleService.getAll(),
    EmployeeService.getAll()
  ])

  const points = pointsRes.status === 'fulfilled' ? pointsRes.value.data : []
  const vehicles = vehiclesRes.status === 'fulfilled' ? vehiclesRes.value.data : []
  const employees = employeesRes.status === 'fulfilled' ? employeesRes.value.data : []

  // update cards
  cards.value[0].value = points.length
  cards.value[1].value = vehicles.filter(v => v.available).length
  cards.value[2].value = employees.filter(e => e.available).length

  // compute points by type
  const typeCounts = {}
  points.forEach(p => {
    const t = p.type || 'Autre'
    typeCounts[t] = (typeCounts[t] || 0) + 1
  })
  pointsByType.value = Object.keys(typeCounts)
    .map(t => ({ type: t, count: typeCounts[t] }))
    .sort((a, b) => b.count - a.count)
  totalPoints.value = points.length

  // compute vehicles by type
  const vehicleTypeCounts = {}
  vehicles.forEach(v => {
    const t = v.type || 'Autre'
    vehicleTypeCounts[t] = (vehicleTypeCounts[t] || 0) + 1
  })
  vehiclesByType.value = Object.keys(vehicleTypeCounts)
    .map(t => ({ type: t, count: vehicleTypeCounts[t] }))
    .sort((a, b) => b.count - a.count)
}

onMounted(loadData)
</script>

<style scoped>
.card {
  border-radius: 8px;
}
.badge {
  font-size: 0.9rem;
}
.fw-bold {
  font-size: 1rem;
}
.text-muted.small {
  font-size: 0.85rem;
}
.border-bottom {
  border-bottom: 1px solid #e9ecef;
}
</style>
