import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:8000/api' : '/api'
)

const api = axios.create({
  baseURL: apiBaseUrl,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('internchain_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api
