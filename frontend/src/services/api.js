// ====================
// frontend/src/services/api.js
// ====================
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('API request with auth token to:', config.url)
  } else {
    console.warn('API request without auth token to:', config.url)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    
    if (error.response?.status === 401) {
      console.warn('Unauthorized - redirecting to login')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
