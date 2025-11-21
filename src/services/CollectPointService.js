import api from "./api";

export default {
  getAll() {
    return api.get("/collect-points");
  },
  getById(id) {
    return api.get(`/collect-points/${id}`);
  },
  create(data) {
    return api.post("/collect-points", data);
  },
  update(id, data) {
    return api.put(`/collect-points/${id}`, data);
  },
  delete(id) {
    return api.delete(`/collect-points/${id}`);
  }
};
