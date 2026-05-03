/**
 * Взаємодії frontend із backend API.
 *
 * Цей модуль ізолює всі HTTP-запити до серверної частини застосунку
 * і використовується сторінками та контекстом автентифікації замість
 * прямих викликів fetch у компонентах.
 *
 * Основні правила взаємодії:
 * - усі запити виконуються через єдиний helper request;
 * - JWT-токен автоматично додається в заголовок Authorization;
 * - backend повертає JSON-відповідь, яку модуль нормалізовано
 *   передає далі у frontend;
 * - сторінки Login, Register, Dashboard, Food і Profile
 *   працюють із даними через цей модуль.
 */


/**
 * Базова адреса backend API.
 *
 * Якщо змінна середовища VITE_API_URL задана, використовується вона.
 * Інакше застосунок працює з локальним сервером за замовчуванням.
 */
const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : 'http://localhost:5000/api'

/**
 * Формує стандартні HTTP-заголовки для запитів до API.
 *
 * Якщо в localStorage збережено JWT-токен, додає заголовок Authorization
 * у форматі Bearer token.
 * @returns {Record<string, string>} Об'єкт HTTP-заголовків для fetch-запиту.
 */
const getHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }
}

/**
 * Виконує HTTP-запит до backend API і повертає розпарсену JSON-відповідь.
 *
 * Автоматично додає базову адресу API, стандартні заголовки та,
 * за потреби, серіалізує тіло запиту. Якщо сервер повертає помилку,
 * викидає виняток з текстом помилки.
 * @param {string} method HTTP-метод запиту.
 * @param {string} path Відносний шлях до API-ендпоінта.
 * @param {object | null} [body] Тіло запиту для POST/PUT операцій.
 * @returns {Promise<object>} Дані відповіді сервера у форматі JSON.
 */
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

/**
 * Публічний клієнт для взаємодії фронтенда з backend API.
 *
 * Містить методи для автентифікації, роботи з профілем користувача,
 * dashboard та записами харчування.
 */
export const api = {
  register: (body) => request('POST', '/auth/register', body),
  login: (body) => request('POST', '/auth/login', body),

  getProfile: () => request('GET', '/profile'),
  updateProfile: (body) => request('PUT', '/profile', body),
  updateWaterGoal: (body) => request('PATCH', '/profile/water-goal', body),
  updateWaterQuickAmounts: (body) => request('PATCH', '/settings/water-quick-amounts', body),

  getDashboard: (date) => request('GET', `/dashboard?date=${date}`),
  getDashboardMonth: (month) => request('GET', `/dashboard/month?month=${month}`),
  getWeekSummary: (date) => request('GET', `/dashboard/week-summary?date=${date}`),

  getFoodLogs: (date) => request('GET', `/food?date=${date}`),
  getFoodStats: (days) => request('GET', `/food/stats?days=${days}`),
  searchFood: (q) => request('GET', `/food/search?q=${encodeURIComponent(q)}`),
  getCustomFoods: () => request('GET', '/food/custom'),
  addFoodLog: (body) => request('POST', '/food', body),
  addCustomFood: (body) => request('POST', '/food/custom', body),
  deleteFoodLog: (id) => request('DELETE', `/food/${id}`),

  getExercises: () => request('GET', '/exercises'),

  getActivityLogs: (date) => request('GET', `/activity?date=${date}`),
  addActivityLog: (body) => request('POST', '/activity', body),
  deleteActivityLog: (id) => request('DELETE', `/activity/${id}`),

  getWeightLog: (date) => request('GET', `/weight?date=${date}`),
  addWeightLog: (body) => request('POST', '/weight', body),
  
  getHydration: (date) => request('GET', `/hydration/${date}`),
  addHydration: (body) => request('POST', '/hydration', body),
  deleteHydration: (id) => request('DELETE', `/hydration/${id}`),
  
  getSleep: (date) => request('GET', `/sleep/${date}`),
  addSleep: (body) => request('POST', '/sleep', body),
  updateSleep: (id, body) => request('PATCH', `/sleep/${id}`, body),
  deleteSleep: (id) => request('DELETE', `/sleep/${id}`),
  getSleepCalendar: (month) => request('GET', `/sleep/calendar?month=${month}`),
}