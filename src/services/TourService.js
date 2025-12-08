import api from './api'

export default {
	getAll() { return api.get('/tours') },
	getById(id) { return api.get(`/tours/${id}`) },
	create(data) { return api.post('/tours', data) },
	// Trigger smart planning on backend. Returns created tour or error
	planifierIntelligent() { return api.post('/tours/planifier-intelligent') },
	// Preview smart planning (proposal only, not saved)
	planifierPreview() { return api.post('/tours/planifier-intelligent/preview') },
	update(id, data) { return api.put(`/tours/${id}`, data) },
	delete(id) { return api.delete(`/tours/${id}`) },
	// Démarrer une tournée (changer statut et rendre ressources indisponibles)
	startTour(id) { return api.post(`/tours/${id}/start`) },
	// Terminer une tournée (libérer ressources et mettre à jour statut)
	finishTour(id) { return api.post(`/tours/${id}/finish`) },
	// Récupère les indicateurs de performance (counts + taux de remplissage)
	getStats() { return api.get('/tours/stats') }
}
