import api from './api'

export default {
  getAll() { return api.get('/notifications') },
  markAsRead(id) { return api.put(`/notifications/${id}/read`) },
  markAllRead() { return api.put(`/notifications/mark-all-read`) },
  create(n) { return api.post('/notifications', n) },
  delete(id) { return api.delete(`/notifications/${id}`) },
  update(id, n) { return api.put(`/notifications/${id}`, n) }
}
