<template>
  <div v-if="show" class="picker-backdrop" @click.self="close">
    <div class="picker-modal">
      <div class="picker-header d-flex justify-content-between align-items-center mb-2">
        <div class="fw-bold">Choisir les coordonnées</div>
        <!-- Effacer les coordonnées sans fermer le modal -->
        <button type="button" class="btn btn-sm btn-outline-secondary" @click.prevent="clearCoordinates">Effacer</button>
      </div>

      <div class="picker-body">
        <MapView 
          :pickable="true" 
          :pickedLat="selected.latitude" 
          :pickedLng="selected.longitude" 
          :mapHeight="mapHeight" 
          @coordinate-picked="onPicked" 
        />
      </div>

      <div class="picker-footer mt-2 d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-secondary btn-sm" @click="close">Annuler</button>
        <button type="button" class="btn btn-primary btn-sm" @click="confirm" :disabled="selected.latitude == null || selected.longitude == null">Confirmer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import MapView from './MapView.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  initialLat: { type: Number, default: null },
  initialLng: { type: Number, default: null },
  mapHeight: { type: [String, Number], default: '420px' }
})

const emit = defineEmits(['update:show', 'picked', 'cancel'])

// Arrondir à 6 décimales
function round6(num) {
  return typeof num === 'number' ? Number(num.toFixed(6)) : null
}

const selected = ref({ 
  latitude: round6(props.initialLat), 
  longitude: round6(props.initialLng) 
})

watch(() => [props.initialLat, props.initialLng], ([lat, lng]) => {
  selected.value.latitude = round6(lat)
  selected.value.longitude = round6(lng)
})

// Fermer le modal
function close() {
  emit('update:show', false)
  emit('cancel')
}

// Confirmer la sélection
function confirm() {
  emit('picked', { 
    latitude: round6(selected.value.latitude), 
    longitude: round6(selected.value.longitude) 
  })
  emit('update:show', false)
}

// Effacer les coordonnées **sans fermer le modal**
function clearCoordinates() {
  selected.value.latitude = null
  selected.value.longitude = null
}

// Mettre à jour les coordonnées depuis la map
function onPicked(payload) {
  selected.value.latitude = round6(payload.latitude)
  selected.value.longitude = round6(payload.longitude)
}
</script>

<style scoped>
.picker-backdrop { position: fixed; inset: 0; display:flex; justify-content:center; align-items:center; background: rgba(0,0,0,0.4); z-index: 99999; padding: 16px }
.picker-modal { width: 900px; max-width: 100%; background: #fff; border-radius: 8px; padding: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3) }
.picker-body { height: var(--picker-map-height, 420px); }
.picker-footer { padding-top: 6px; }

@media (max-width: 900px) {
  .picker-modal { width: 100%; padding: 8px }
}
</style>
