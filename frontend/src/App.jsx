/**
 * Головний модуль маршрутизації frontend-застосунку.
 *
 * Цей файл визначає, які сторінки доступні користувачу,
 * як розділяються публічні та приватні маршрути, і як
 * стан автентифікації впливає на навігацію в застосунку.
 *
 * Модуль використовує AuthContext для перевірки поточного
 * користувача і керує доступом до сторінок входу, реєстрації,
 * dashboard, харчування та профілю.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Food from './pages/Food'
import Activity from './pages/Activity'
import Hydration from './pages/Hydration'
import Profile from './pages/Profile'
import Sleep from './pages/Sleep'
import './styles/main.css'
import './styles/components.css'

/**
 * Захищає приватні маршрути застосунку.
 *
 * Показує сторінку завантаження під час відновлення стану автентифікації.
 * Якщо користувач не авторизований, перенаправляє на сторінку входу.
 * @param {object} props Властивості компонента.
 * @param {object} props.children Дочірній елемент, який потрібно відобразити для авторизованого користувача.
 * @returns {object} JSX-елемент захищеного маршруту або перенаправлення.
 */
function PrivateRoute({children}) {
  const { user, loading } = useAuth()
  if(loading) return <div style={{ padding: 24 }}>Завантаження...</div>
  return user ? children : <Navigate to="/login" />
}

/**
 * Обмежує доступ до публічних маршрутів для авторизованих користувачів.
 *
 * Якщо користувач уже увійшов у систему, перенаправляє його на головну сторінку.
 * Під час ініціалізації стану автентифікації показує повідомлення про завантаження.
 * @param {object} props Властивості компонента.
 * @param {object} props.children Дочірній елемент публічного маршруту.
 * @returns {object} JSX-елемент публічного маршруту або перенаправлення.
 */
function PublicRoute({children}) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 24 }}>Завантаження...</div>
  return user ? <Navigate to="/" /> : children
}

/**
 * Кореневий компонент клієнтського застосунку.
 *
 * Налаштовує провайдер автентифікації, маршрутизацію та розподіл
 * публічних і приватних сторінок.
 * @returns {object} Кореневий JSX-елемент застосунку.
 */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PublicRoute><Login /></PublicRoute>
          }/>
          <Route path="/register" element={
            <PublicRoute><Register /></PublicRoute>
          }/>
          <Route path="/" element={
            <PrivateRoute><Layout /></PrivateRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="food" element={<Food />} />
            <Route path="activity" element={<Activity />} />
            <Route path="hydration" element={<Hydration />} />
            <Route path="sleep" element={<Sleep />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}