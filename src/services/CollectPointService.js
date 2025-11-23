import axios from "axios";

const API_URL = "http://localhost:8081/api/collect-points";

export default {
  getAll: () => axios.get(API_URL),
  create: (payload) => axios.post(API_URL, payload),
  update: (id, payload) => axios.put(`${API_URL}/${id}`, payload),
  delete: (id) => axios.delete(`${API_URL}/${id}`)
}
