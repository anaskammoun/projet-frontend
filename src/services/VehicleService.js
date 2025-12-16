import api from './api'

export default {
	getAll() { return api.get('/vehicles') },
	getById(id) { return api.get(`/vehicles/${id}`) },
	create(data) { return api.post('/vehicles', data) },
	update(id, data) { return api.put(`/vehicles/${id}`, data) },
	delete(id) { return api.delete(`/vehicles/${id}`) },
	getByAvailable(available) { return api.get(`/vehicles?available=${available}`) },
	getByType(type) { return api.get(`/vehicles?type=${encodeURIComponent(type)}`) },
	getByAvailableAndType(available, type) { return api.get(`/vehicles?available=${available}&type=${encodeURIComponent(type)}`) }
}
