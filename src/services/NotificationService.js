import axios from 'axios'

const API_URL = 'http://localhost:8081/api/notifications'

export default {
  getAll() { return axios.get(API_URL) },
  markAsRead(id) { return axios.put(`${API_URL}/${id}/read`) },
  markAllRead() { return axios.put(`${API_URL}/mark-all-read`) },
  create(n) { return axios.post(API_URL, n) },
  delete(id) { return axios.delete(`${API_URL}/${id}`) },
  update(id, n) { return axios.put(`${API_URL}/${id}`, n) }
}
