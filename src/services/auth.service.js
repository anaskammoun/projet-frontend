import api from './api'

const TOKEN_KEY = 'app_token'

export default {
	async login(credentials) {
		const res = await api.post('/auth/login', credentials)
		if (res && res.data && res.data.token) {
			localStorage.setItem(TOKEN_KEY, res.data.token)
			api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
		}
		return res
	},
	logout() {
		localStorage.removeItem(TOKEN_KEY)
		delete api.defaults.headers.common['Authorization']
	},
	getToken() {
		return localStorage.getItem(TOKEN_KEY)
	}
}
