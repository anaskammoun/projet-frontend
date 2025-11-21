<template>
	<div class="map-wrapper">
		<div id="map" ref="mapEl" class="map-el"></div>

		<div class="map-controls">
			<button class="btn btn-sm btn-light" @click="resetView" title="Réinitialiser la vue">⤢</button>
			<button class="btn btn-sm btn-light" @click="locateUser" title="Se localiser">📍</button>
			<select class="form-select form-select-sm" v-model="filterStatus" @change="applyFilter" title="Filtrer">
				<option value="all">Tous</option>
				<option value="VIDE">VIDE</option>
				<option value="NORMAL">NORMAL</option>
				<option value="PRESQUE_PLEIN">PRESQUE_PLEIN</option>
				<option value="PLEIN">PLEIN</option>
				<option value="EN_MAINTENANCE">EN_MAINTENANCE</option>
			</select>
		</div>

			<div class="map-legend card p-2">
				<div class="legend-title fw-bold">Légende</div>
				<div class="legend-item"><span class="dot vide"></span> VIDE</div>
				<div class="legend-item"><span class="dot normal"></span> NORMAL</div>
				<div class="legend-item"><span class="dot presque"></span> PRESQUE_PLEIN</div>
				<div class="legend-item"><span class="dot full"></span> PLEIN</div>
				<div class="legend-item"><span class="dot maintenance"></span> EN_MAINTENANCE</div>
			</div>

		<div class="map-stats card p-2">
			<div class="small text-muted">Points</div>
			<div class="h5 mb-0">{{ stats.total }}</div>
			<div class="small text-muted">Disponibles: {{ stats.available }}</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import pointsService from '../services/pointsService'

const mapEl = ref(null)
let map = null
let markersLayer = null

const stats = ref({ total: 0, available: 0 })
const filterStatus = ref('all')

function styleForPoint(p) {
	const st = (p.status || '').toUpperCase()
	// map explicit states
	if (st === 'VIDE') return { color: '#2ecc71', fillColor: '#2ecc71', radius: 7 }
	if (st === 'NORMAL') return { color: '#4dc9f6', fillColor: '#4dc9f6', radius: 8 }
	if (st === 'PRESQUE_PLEIN') return { color: '#f5a623', fillColor: '#f5a623', radius: 9 }
	if (st === 'PLEIN') return { color: '#e55353', fillColor: '#e55353', radius: 10 }
	if (st === 'EN_MAINTENANCE') return { color: '#6c757d', fillColor: '#6c757d', radius: 9 }

	// fallback to fillLevel thresholds if status missing
	if (typeof p.fillLevel === 'number') {
		const lvl = p.fillLevel
		if (lvl >= 80) return { color: '#e55353', fillColor: '#e55353', radius: 10 }
		if (lvl >= 50) return { color: '#f5a623', fillColor: '#f5a623', radius: 9 }
		return { color: '#39b54a', fillColor: '#39b54a', radius: 8 }
	}
	return { color: '#6c757d', fillColor: '#6c757d', radius: 9 }
}

function buildPopup(p) {
	const lines = []
	lines.push(`<strong>Waste Type:</strong> ${p.wasteType || '—'}`)
	if (typeof p.fillLevel === 'number') lines.push(`<strong>Fill Level:</strong> ${p.fillLevel}%`)
	if (p.status) lines.push(`<strong>Status:</strong> ${p.status}`)
	if (p.latitude && p.longitude) lines.push(`<strong>Coord:</strong> ${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}`)
	return lines.join('<br/>')
}

async function addMarkers(points) {
	if (!markersLayer) markersLayer = L.layerGroup().addTo(map)
	markersLayer.clearLayers()

	points.forEach(p => {
		if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') return
		if (filterStatus.value !== 'all' && (p.status || '').toUpperCase() !== (filterStatus.value || '').toUpperCase()) return

		const s = styleForPoint(p)
		const marker = L.circleMarker([p.latitude, p.longitude], {
			radius: s.radius,
			color: s.color,
			fillColor: s.fillColor,
			fillOpacity: 0.95,
			weight: 1,
			className: 'custom-marker'
		})
		marker.bindPopup(buildPopup(p), { maxWidth: 260 })
		marker.addTo(markersLayer)
	})
}

async function load() {
	try {
		const res = await pointsService.getAll()
		const points = res && res.data ? res.data : []
		stats.value.total = points.length
		// available = not PLEIN and not EN_MAINTENANCE
		stats.value.available = points.filter(p => {
			const s = (p.status || '').toUpperCase()
			return s !== 'PLEIN' && s !== 'EN_MAINTENANCE'
		}).length
		await addMarkers(points)
	} catch (e) {
		console.error('Erreur chargement points', e)
	}
}

function resetView() {
	if (map) map.setView([36.8, 10.18], 12)
}

function applyFilter() {
	load()
}

function locateUser() {
	if (!map) return
	map.locate({ setView: true, maxZoom: 14 })
}

onMounted(async () => {
	map = L.map(mapEl.value, { preferCanvas: true, zoomControl: false }).setView([36.8, 10.18], 12)

	L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
		attribution: '&copy; OpenStreetMap & CARTO',
		maxZoom: 19
	}).addTo(map)

	L.control.zoom({ position: 'bottomright' }).addTo(map)

	map.on('locationfound', e => {
		const r = L.circle(e.latlng, { radius: Math.max(e.accuracy, 20), color: '#4dc9f6', opacity: 0.6 }).addTo(map)
		setTimeout(() => { try { map.removeLayer(r) } catch (e) {} }, 4000)
	})

	await load()
})

onBeforeUnmount(() => {
	try { if (map) map.remove() } catch (e) {}
})
</script>

<style scoped>
.map-wrapper { position: relative; width: 100%; }
.map-el { width: 100%; height: 700px; border-radius: 8px; box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
.map-controls { position: absolute; top: 12px; left: 12px; display: flex; gap: 6px; align-items: center; z-index: 600; }
.map-controls .form-select { width: 160px; }
.map-legend { position: absolute; right: 12px; top: 12px; z-index: 600; min-width: 140px; }
.map-legend .legend-item { display:flex; align-items:center; gap:8px; padding-top:6px }
.map-legend .dot { width:12px; height:12px; border-radius:50%; display:inline-block }
.map-legend .dot.vide { background:#2ecc71 }
.map-legend .dot.normal { background:#4dc9f6 }
.map-legend .dot.presque { background:#f5a623 }
.map-legend .dot.full { background:#e55353 }
.map-legend .dot.maintenance { background:#6c757d }
.map-stats { position: absolute; right: 12px; bottom: 12px; z-index: 600; min-width: 120px; text-align:center }
.custom-marker { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }

@media (max-width: 991px) {
	.map-el { height: 520px }
	.map-controls { flex-direction: row; gap: 4px }
	.map-legend { right: 8px; top: 8px }
}
</style>