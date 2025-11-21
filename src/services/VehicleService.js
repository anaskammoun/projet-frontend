import api from './api'

export default {
	getAll() { return api.get('/vehicles') },
	getById(id) { return api.get(`/vehicles/${id}`) },
	create(data) { return api.post('/vehicles', data) },
	update(id, data) { return api.put(`/vehicles/${id}`, data) },
	delete(id) { return api.delete(`/vehicles/${id}`) }
}
