import axios from 'axios'

const API_URL = 'http://localhost:8081/api/collect-points'

export default {
  getAll() {
    return axios.get(API_URL)
  },
  getByStatus(status) {
    return axios.get(`${API_URL}?status=${encodeURIComponent(status)}`)
  },
  getByWasteType(type) {
    return axios.get(`${API_URL}?wasteType=${encodeURIComponent(type)}`)
  },
  create(point) {
    return axios.post(API_URL, point)
  },
  update(id, point) {
    return axios.put(`${API_URL}/${id}`, point)
  },
  delete(id) {
    return axios.delete(`${API_URL}/${id}`)
  },
  // ❗ Ajoute cette méthode pour planifier
  planifier() {
    return axios.put(`${API_URL}/planifier`)
  }
}
