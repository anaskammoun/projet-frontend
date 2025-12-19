import api from './api'

export default {
	getAll() { return api.get('/employees') },
	getById(id) { return api.get(`/employees/${id}`) },
	getMe() { return api.get('/employees/me') },
	create(data) { return api.post('/employees', data) },
	update(id, data) { return api.put(`/employees/${id}`, data) },
	delete(id) { return api.delete(`/employees/${id}`) },
	getByAvailable(available) { return api.get(`/employees?available=${available}`) },
	getByCin(cin) { return api.get(`/employees?cin=${encodeURIComponent(cin)}`) }
}
