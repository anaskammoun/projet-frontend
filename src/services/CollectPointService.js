import api from './api'

export default {
  getAll() {
    return api.get('/collect-points')
  },
  getByStatus(status) {
    return api.get(`/collect-points?status=${encodeURIComponent(status)}`)
  },
  getByWasteType(type) {
    return api.get(`/collect-points?wasteType=${encodeURIComponent(type)}`)
  },
  create(point) {
    return api.post('/collect-points', point)
  },
  update(id, point) {
    return api.put(`/collect-points/${id}`, point)
  },
  delete(id) {
    return api.delete(`/collect-points/${id}`)
  },
  // ❗ Ajoute cette méthode pour planifier
  planifier() {
    return api.put(`/collect-points/planifier`)
  }
}
