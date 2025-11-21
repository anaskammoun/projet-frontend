import api from './api'

export default {
	getAll() { return api.get('/tours') },
	getById(id) { return api.get(`/tours/${id}`) },
	create(data) { return api.post('/tours', data) },
	update(id, data) { return api.put(`/tours/${id}`, data) },
	delete(id) { return api.delete(`/tours/${id}`) }
}
