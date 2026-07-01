import axios from 'axios'
import { setupCache } from 'axios-cache-interceptor'

const rawApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api'),
})

// Setup robust caching for GET requests (5 minutes TTL)
const api = setupCache(rawApi, {
  ttl: 5 * 60 * 1000, // 5 minutes
  methods: ['get']
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('internchain_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Invalidate entire cache if any mutation happens
api.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase();

    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      api.storage.clear();
      console.log('API cache cleared due to mutation');
    }

    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
)

export default api
