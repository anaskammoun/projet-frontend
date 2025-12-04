import api from './api'

const TOKEN_KEY = 'app_token'

export default {
	async register(credentials) {
		const res = await api.post('/auth/register', credentials)
		return res
	},
	async login(credentials) {
		const res = await api.post('/auth/login', credentials)
		if (res && res.data && res.data.token) {
			localStorage.setItem(TOKEN_KEY, res.data.token)
			api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
		}
		return res
	},
	async getCurrentUser() {
		const token = this.getToken()
		if (!token) return null
		api.defaults.headers.common['Authorization'] = `Bearer ${token}`
		try {
			const res = await api.get('/auth/me')
			return res.data
		} catch (error) {
			this.logout()
			return null
		}
	},
	logout() {
		localStorage.removeItem(TOKEN_KEY)
		delete api.defaults.headers.common['Authorization']
	},
	getToken() {
		return localStorage.getItem(TOKEN_KEY)
	},
	isAuthenticated() {
		return !!this.getToken()
	}
}
