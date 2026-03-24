import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Food from './pages/Food'
import Profile from './pages/Profile'
import './styles/main.css'
import './styles/components.css'

/**
 * Захищає приватні маршрути застосунку.
 *
 * Показує сторінку завантаження під час відновлення стану автентифікації.
 * Якщо користувач не авторизований, перенаправляє на сторінку входу.
 *
 * @param {Object} props Властивості компонента.
 * @returns {Object}
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
 *
 * @param {Object} props Властивості компонента.
 * @returns {Object}
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
 *
 * @returns {Object}
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
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}