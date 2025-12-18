import api from './api'

const TOKEN_KEY = 'app_token'
const ROLE_KEY = 'app_role'

export default {
	async register(credentials) {
		// credentials may include role: 'ADMIN' | 'EMPLOYE' | 'CITOYEN'
		const res = await api.post('/auth/register', credentials)
		return res
	},
	async login(credentials) {
		const res = await api.post('/auth/login', credentials)
		if (res?.data?.token) {
			localStorage.setItem(TOKEN_KEY, res.data.token)
			if (res.data.role) localStorage.setItem(ROLE_KEY, res.data.role)
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
		localStorage.removeItem(ROLE_KEY)
		delete api.defaults.headers.common['Authorization']
	},
	getToken() {
		return localStorage.getItem(TOKEN_KEY)
	},
	getRole() {
		return localStorage.getItem(ROLE_KEY)
	},
	hasRole(...roles) {
		const role = this.getRole()
		if (!role) return false
		return roles.map(r => r.toUpperCase()).includes(role.toUpperCase())
	},
	isAuthenticated() {
		return !!this.getToken()
	}
}
