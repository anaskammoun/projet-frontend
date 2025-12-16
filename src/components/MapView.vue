<template>
	<div class="map-wrapper">
		<div id="map" ref="mapEl" class="map-el" :style="mapInlineStyle"></div>

		<div class="map-controls">
			<button type="button" class="btn btn-sm btn-light" @click="resetView" title="Réinitialiser la vue">⤢</button>
			<button type="button" class="btn btn-sm btn-light" @click="locateUser" title="Se localiser">📍</button>
				<div v-if="props.pickable" style="display:flex;align-items:center;gap:6px;">
					<div class="small text-muted">Cliquez sur la carte pour choisir les coordonnées</div>
					<button type="button" class="btn btn-sm btn-outline-secondary" @click.prevent="clearPick" title="Effacer sélection">✕</button>
				</div>
			<select class="form-select form-select-sm" v-model="filterStatus" @change="applyFilter" title="Filtrer">
				<option value="all">Tous</option>
				<option value="VIDE">VIDE</option>
				<option value="NORMAL">NORMAL</option>
				<option value="PRESQUE_PLEIN">PRESQUE_PLEIN</option>
				<option value="PLEIN">PLEIN</option>
			</select>

		</div>

			<div class="map-legend card p-2">
				<div class="legend-title fw-bold">Légende</div>
				<div class="legend-item"><span class="dot vide"></span> VIDE</div>
				<div class="legend-item"><span class="dot normal"></span> NORMAL</div>
				<div class="legend-item"><span class="dot presque"></span> PRESQUE_PLEIN</div>
				<div class="legend-item"><span class="dot full"></span> PLEIN</div>
				<div class="legend-item"><span class="dot vehicle"></span> VÉHICULE</div>
			</div>

		<div class="map-stats card p-2">
			<div class="small text-muted">Points</div>
			<div class="h5 mb-0">{{ stats.total }}</div>
			<div class="small text-muted">Disponibles: {{ stats.available }}</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import pointsService from '../services/CollectPointService.js'
import vehicleService from '../services/VehicleService.js'

const props = defineProps({
	// routePoints: array of collectPoint objects (with latitude/longitude)
	routePoints: { type: Array, default: null },
	// optional vehicle object to use as route start
	routeVehicle: { type: Object, default: null },
	// allow parent pages to enable coordinate picking mode
	pickable: { type: Boolean, default: false },
	// optional values to display/update the pick marker from parent
	pickedLat: { type: Number, default: null },
	pickedLng: { type: Number, default: null },
	// optional override height for embedded maps (examples: '320px' or 300)
	mapHeight: { type: [String, Number], default: null }
})

const emit = defineEmits(['coordinate-picked'])

const mapEl = ref(null)
let map = null
let markersLayer = null
let vehiclesLayer = null
let routeLayer = null
let pickMarker = null

const stats = ref({ total: 0, available: 0, vehicles: 0 })
const filterStatus = ref('all')
const showVehicles = ref(true)

// load car icon
const carIconUrl = new URL('../assets/car-icon.svg', import.meta.url).href
const carIcon = L.icon({
	iconUrl: carIconUrl,
	iconSize: [36, 36],
	iconAnchor: [18, 36],
	popupAnchor: [0, -36]
})

// if this component receives a route via props, draw it
watch(() => props.routePoints, async (newVal) => {
	if (!map) return
	try {
		if (!newVal || newVal.length === 0) {
			// remove route
			if (routeLayer) { try { map.removeLayer(routeLayer) } catch (e) {} }
			routeLayer = null
			return
		}

		// compute coordinates array: if a vehicle is provided, start from vehicle coords
		const coords = []
		if (props.routeVehicle && typeof props.routeVehicle.latitude === 'number' && typeof props.routeVehicle.longitude === 'number') {
			coords.push([props.routeVehicle.latitude, props.routeVehicle.longitude])
		}
		for (const p of newVal) {
			if (typeof p.latitude === 'number' && typeof p.longitude === 'number') coords.push([p.latitude, p.longitude])
		}

		// remove existing route layer
		if (routeLayer) { try { map.removeLayer(routeLayer) } catch (e) {} }

		// draw a realistic route by requesting geometry from a routing engine (OSRM public service)
		if (coords.length >= 2) {
			// Build coordinate string for OSRM (lon,lat;lon,lat;...)
			const coordStr = coords.map(c => `${c[1]},${c[0]}`).join(';')
			const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`

			try {
				const r = await fetch(url)
				if (!r.ok) throw new Error('routing failed')
				const data = await r.json()
				if (data && data.routes && data.routes.length) {
					const geo = data.routes[0].geometry
					// remove existing route
					if (routeLayer) { try { map.removeLayer(routeLayer) } catch (e) {} }
					routeLayer = L.layerGroup().addTo(map)
					// add route geometry
					L.geoJSON(geo, { style: { color: '#198754', weight: 4, opacity: 0.9 } }).addTo(routeLayer)
					// add small point markers for legs / stops
					coords.forEach((c, idx) => {
						L.circleMarker(c, { radius: 5, color: '#198754', fillColor: '#198754', fillOpacity: 1 }).addTo(routeLayer)
					})
					try { map.fitBounds(L.geoJSON(geo).getBounds(), { padding: [40,40] }) } catch (e) {}
				} else {
					// fallback to straight polyline if no route found
					routeLayer = L.layerGroup().addTo(map)
					const poly = L.polyline(coords, { color: '#198754', weight: 4, opacity: 0.85 }).addTo(routeLayer)
					coords.forEach((c) => L.circleMarker(c, { radius: 5, color: '#198754', fillColor: '#198754', fillOpacity: 1 }).addTo(routeLayer))
					try { map.fitBounds(poly.getBounds(), { padding: [40,40] }) } catch(e) {}
				}
			} catch (err) {
				// any error -> fallback to simple straight polyline
				console.warn('Routing request failed, falling back to straight lines:', err)
				routeLayer = L.layerGroup().addTo(map)
				const poly = L.polyline(coords, { color: '#198754', weight: 4, opacity: 0.85 }).addTo(routeLayer)
				coords.forEach((c) => L.circleMarker(c, { radius: 5, color: '#198754', fillColor: '#198754', fillOpacity: 1 }).addTo(routeLayer))
				try { map.fitBounds(poly.getBounds(), { padding: [40,40] }) } catch(e) {}
			}
		}
	} catch (e) {
		console.error('Erreur affichage route', e)
	}
}, { immediate: true })

function computeStatus(p) {
	// Normalize: prefer explicit `status` if server sets a human-friendly value
	if (p && typeof p.status === 'string' && p.status.trim().length > 0) {
		const s = p.status.trim().toUpperCase()
		// Accept backend values like 'OK' / 'ALERTE' and map them to our UI buckets
		if (s === 'OK') return 'NORMAL'
		if (s === 'ALERTE') return 'PRESQUE_PLEIN'
		// If status already matches UI buckets (VIDE, NORMAL, PRESQUE_PLEIN, PLEIN)
		return s
	}

	// Fallback: derive status from capacity percentages (capacityLiters / maxCapacityLiters)
	if (typeof p.capacityLiters === 'number' && typeof p.maxCapacityLiters === 'number' && p.maxCapacityLiters > 0) {
		const ratio = (p.capacityLiters / p.maxCapacityLiters) * 100
		if (ratio === 0) return 'VIDE'
		if (ratio <= 50) return 'NORMAL'
		if (ratio <= 80) return 'PRESQUE_PLEIN'
		return 'PLEIN'
	}

}

function styleForPoint(p) {
	const st = computeStatus(p)
	// map explicit states
	if (st === 'VIDE') return { color: '#2ecc71', fillColor: '#2ecc71', radius: 7 }
	if (st === 'NORMAL') return { color: '#4dc9f6', fillColor: '#4dc9f6', radius: 8 }
	if (st === 'PRESQUE_PLEIN') return { color: '#f5a623', fillColor: '#f5a623', radius: 9 }
	if (st === 'PLEIN') return { color: '#e55353', fillColor: '#e55353', radius: 10 }

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
	// Show computed fill level when available
	if (typeof p.capacityLiters === 'number' && typeof p.maxCapacityLiters === 'number' && p.maxCapacityLiters > 0) {
		const fill = Math.round((p.capacityLiters / p.maxCapacityLiters) * 100)
		lines.push(`<strong>Fill Level:</strong> ${fill}%`)
	}
	if (p.status) lines.push(`<strong>Status:</strong> ${p.status}`)
	if (p.latitude && p.longitude) lines.push(`<strong>Coord:</strong> ${formatCoordinate(p.latitude)},${formatCoordinate(p.longitude)}`)
	return lines.join('<br/>')
}

function formatCoordinate(value) {
	if (value === null || value === undefined) return '-'
	return parseFloat(Number(value).toFixed(6)).toString()
}

async function addMarkers(points) {
	if (!markersLayer) markersLayer = L.layerGroup().addTo(map)
	markersLayer.clearLayers()

	points.forEach(p => {
		if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') return
		// Use computed status for filtering so back-end vs front-end strings mismatch doesn't break filtering
		const computed = (computeStatus(p) || '').toUpperCase()
		if (filterStatus.value !== 'all' && computed !== (filterStatus.value || '').toUpperCase()) return

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

async function addVehicleMarkers(vehicles) {
	if (!vehiclesLayer) vehiclesLayer = L.layerGroup().addTo(map)
	vehiclesLayer.clearLayers()

	if (!showVehicles.value) return

	vehicles.forEach(v => {
		if (typeof v.latitude !== 'number' || typeof v.longitude !== 'number') return

		// Use car icon marker
		const marker = L.marker([v.latitude, v.longitude], { icon: carIcon, title: v.matricule || 'Véhicule' })

		const popup = [
			`<strong>Véhicule:</strong> ${v.matricule || '-'} (${v.type || '-'})`,
			`<strong>Capacité:</strong> ${v.capacity ?? '-'} L`,
			`<strong>Disponible:</strong> ${v.available ? 'Oui' : 'Non'}`,
			v.latitude && v.longitude ? `<strong>Coord:</strong> ${formatCoordinate(v.latitude)},${formatCoordinate(v.longitude)}` : ''
		].filter(Boolean).join('<br/>')

		marker.bindPopup(popup, { maxWidth: 260 })
		marker.addTo(vehiclesLayer)
	})
}

async function load() {
	try {
		const [pRes, vRes] = await Promise.allSettled([pointsService.getAll(), vehicleService.getAll()])
		const points = pRes.status === 'fulfilled' && pRes.value.data ? pRes.value.data : []
		const vehicles = vRes.status === 'fulfilled' && vRes.value.data ? vRes.value.data : []

		stats.value.total = points.length
		// available = not PLEIN
		stats.value.available = points.filter(p => {
			const s = (p.status || '').toUpperCase()
			return s !== 'PLEIN'
		}).length
		stats.value.vehicles = vehicles.length
		await addMarkers(points)
		await addVehicleMarkers(vehicles)
		fitToData(points, vehicles)
	} catch (e) {
		console.error('Erreur chargement points', e)
	}
}

function fitToData(points, vehicles) {
	if (!map) return
	const bounds = L.latLngBounds([])
	points.forEach(p => {
		if (typeof p.latitude === 'number' && typeof p.longitude === 'number') {
			bounds.extend([p.latitude, p.longitude])
		}
	})
	vehicles.forEach(v => {
		if (typeof v.latitude === 'number' && typeof v.longitude === 'number') {
			bounds.extend([v.latitude, v.longitude])
		}
	})
	if (bounds.isValid()) {
		try { map.fitBounds(bounds, { padding: [40, 40] }) } catch (e) {}
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
	map = L.map(mapEl.value, { preferCanvas: true, zoomControl: false, scrollWheelZoom: true }).setView([36.8, 10.18], 12)

		// when in pickable mode the map should allow picking coordinates
		if (props.pickable) {
			// show help and attach click handler
			map.on('click', e => {
				// create or update the pick marker
				const { lat, lng } = e.latlng
				if (!pickMarker) {
					pickMarker = L.marker([lat, lng], { draggable: true }).addTo(map)
					pickMarker.on('dragend', ev => {
						const ll = ev.target.getLatLng()
						emit('coordinate-picked', { latitude: ll.lat, longitude: ll.lng })
					})
				} else {
					pickMarker.setLatLng([lat, lng])
				}

				// sync parent props changes (if the parent sets coordinates programmatically)
				watch(() => [props.pickedLat, props.pickedLng], ([lat, lng]) => {
					if (!map) return
					if (typeof lat === 'number' && typeof lng === 'number') {
						if (!pickMarker) {
							pickMarker = L.marker([lat, lng], { draggable: true }).addTo(map)
							pickMarker.on('dragend', ev => {
								const ll = ev.target.getLatLng()
								emit('coordinate-picked', { latitude: ll.lat, longitude: ll.lng })
							})
						} else {
							pickMarker.setLatLng([lat, lng])
						}
					} else {
						// no coordinates passed -> remove marker
						if (pickMarker) { try { map.removeLayer(pickMarker) } catch (e) {} }
						pickMarker = null
					}
				})
				emit('coordinate-picked', { latitude: lat, longitude: lng })
			})

			// If parent already provided coordinates, show marker
			if (typeof props.pickedLat === 'number' && typeof props.pickedLng === 'number') {
				if (!pickMarker) pickMarker = L.marker([props.pickedLat, props.pickedLng], { draggable: true }).addTo(map)
				else pickMarker.setLatLng([props.pickedLat, props.pickedLng])
				pickMarker.on('dragend', ev => {
					const ll = ev.target.getLatLng()
					emit('coordinate-picked', { latitude: ll.lat, longitude: ll.lng })
				})
				try { map.setView([props.pickedLat, props.pickedLng], 14) } catch(e) {}
			}
		}

	L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
		attribution: '&copy; OpenStreetMap & CARTO',
		maxZoom: 19
	}).addTo(map)

	L.control.zoom({ position: 'bottomright' }).addTo(map)

	// Assure l'activation du zoom à la molette (certains thèmes Leaflet le désactivent par défaut)
	try { map.scrollWheelZoom.enable() } catch (e) {}

	map.on('locationfound', e => {
		const r = L.circle(e.latlng, { radius: Math.max(e.accuracy, 20), color: '#4dc9f6', opacity: 0.6 }).addTo(map)
		setTimeout(() => { try { map.removeLayer(r) } catch (e) {} }, 4000)
	})

	await load()
})

const mapInlineStyle = computed(() => {
	if (!props.mapHeight) return undefined
	const v = props.mapHeight
	return { height: typeof v === 'number' ? `${v}px` : v }
})

onBeforeUnmount(() => {
	try { if (map) map.remove() } catch (e) {}
})

function clearPick() {
	if (!map) return
	if (pickMarker) { try { map.removeLayer(pickMarker) } catch (e) {} }
	pickMarker = null
	emit('coordinate-picked', { latitude: null, longitude: null })
}


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
.map-legend .dot.vehicle { background: none; width:18px; height:18px; border-radius:0; display:inline-block; background-image: url('../assets/car-icon.svg'); background-size: contain; background-repeat: no-repeat }
.map-stats { position: absolute; right: 12px; bottom: 12px; z-index: 600; min-width: 120px; text-align:center }
.custom-marker { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
.vehicle-marker { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); stroke-width:1px }

@media (max-width: 991px) {
	.map-el { height: 520px }
	.map-controls { flex-direction: row; gap: 4px }
	.map-legend { right: 8px; top: 8px }
}
</style>