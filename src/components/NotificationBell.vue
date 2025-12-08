<template>
  <div class="notification-bell dropdown" @click.stop>
    <button class="btn btn-light position-relative" @click="toggle">
      🔔
      <span v-if="unreadCount>0" class="badge bg-danger position-absolute top-0 start-100 translate-middle">{{ unreadCount }}</span>
    </button>

    <div v-if="open" class="card notification-popup p-2 shadow-sm">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong>Notifications</strong>
        <div>
          <small class="text-muted me-2">{{ notifications.length }} total</small>
          <button v-if="unreadCount>0" class="btn btn-sm btn-outline-primary" @click.stop="markAllRead">Marquer tout lu</button>
        </div>
      </div>

      <div v-if="notifications.length === 0" class="small text-muted">Aucune notification</div>

      <div class="notifications-list">
        <div v-for="n in notifications" :key="n.id" :class="['notification-item', 'p-2', 'mb-1', 'border', 'rounded', n.read ? 'text-muted' : 'bg-light']">
          <div class="d-flex justify-content-between">
            <div>
              <div class="fw-semibold">{{ n.type }}</div>
              <div class="small text-muted">{{ n.message }}</div>
              <div v-if="n.latitude != null && n.longitude != null" class="small text-info">📍 {{ formatCoordinate(n.latitude) }},{{ formatCoordinate(n.longitude) }}</div>
            </div>
            <div class="text-end">
              <div class="small text-muted">{{ formatDate(n.timestamp) }}</div>
              <div class="d-flex flex-column align-items-end">
                <button v-if="!n.read" class="btn btn-sm btn-outline-success mb-1" @click.stop="markRead(n.id)">Marquer lu</button>
                <button class="btn btn-sm btn-link text-danger" @click.stop="remove(n.id)">Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import service from '../services/NotificationService.js'

const notifications = ref([])
const open = ref(false)
const pollInterval = ref(null)

async function load() {
  try {
    const r = await service.getAll()
    // Trier les notifications par timestamp décroissant (plus récentes en haut)
    notifications.value = (r.data || []).sort((a, b) => {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0
      return dateB - dateA
    })
  } catch (e) {
    console.error('Failed to fetch notifications', e)
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) load()
}

function formatDate(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString()
}

function formatCoordinate(value) {
  if (value === null || value === undefined) return '-'
  return parseFloat(value.toFixed(6)).toString()
}

async function remove(id) {
  try {
    await service.delete(id)
    await load()
  } catch (e) {
    console.error('Failed to delete notification', e)
  }
}

async function markRead(id) {
  try {
    await service.markAsRead(id)
    await load()
  } catch (e) { console.error('Failed to mark as read', e) }
}

async function markAllRead() {
  try {
    await service.markAllRead()
    await load()
  } catch (e) { console.error('Failed to mark all read', e) }
}

onMounted(() => {
  load()
  pollInterval.value = setInterval(load, 5000)
})

onBeforeUnmount(() => {
  if (pollInterval.value) clearInterval(pollInterval.value)
})

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
</script>

<style scoped>
.notification-bell { position: relative; }
.notification-popup { position: absolute; right: -8px; top: 44px; width: 360px; z-index: 2000; }
.notification-item { background: #fff }
.notifications-list { 
  max-height: 400px; 
  overflow-y: auto; 
  overflow-x: hidden;
}
.notifications-list::-webkit-scrollbar {
  width: 8px;
}
.notifications-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}
.notifications-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}
.notifications-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
