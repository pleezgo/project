const BASE_URL = 'http://localhost:5000/api'

const getHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

const request = async (method, path, body = null) => {
  const options = {
    method,
    headers: getHeaders()
  }
  if(body) options.body = JSON.stringify(body)

  const res = await fetch(`${BASE_URL}${path}`, options)
  const data = await res.json()

  if (!res.ok) throw new Error(data.error || 'Помилка запиту')
  return data
}

export const api = {
  register: (body) => request('POST', '/auth/register', body),
  login: (body) => request('POST', '/auth/login', body),

  getProfile: () => request('GET', '/profile'),
  updateProfile: (body) => request('PUT', '/profile', body),

  getDashboard: (date) => request('GET', `/dashboard?date=${date}`),

  getFoodLogs: (date) => request('GET', `/food?date=${date}`),
  getFoodStats: (days) => request('GET', `/food/stats?days=${days}`),
  searchFood: (q) => request('GET', `/food/search?q=${encodeURIComponent(q)}`),
  getCustomFoods: () => request('GET', '/food/custom'),
  addFoodLog: (body) => request('POST', '/food', body),
  addCustomFood: (body) => request('POST', '/food/custom', body),
  deleteFoodLog: (id) => request('DELETE', `/food/${id}`)
}