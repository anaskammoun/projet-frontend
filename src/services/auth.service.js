// Authentication removed; provide no-op helpers for compatibility
const TOKEN_KEY = 'app_token'

export default {
  async register() {
    return { data: { message: 'auth disabled' } }
  },
  async login() {
    return { data: { message: 'auth disabled' } }
  },
  async getCurrentUser() {
    return null
  },
  logout() {
    localStorage.removeItem(TOKEN_KEY)
  },
  getToken() {
    return null
  },
  isAuthenticated() {
    return true
  }
}
