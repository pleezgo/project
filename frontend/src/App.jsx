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

function PrivateRoute({children}) {
  const { user, loading } = useAuth()
  if(loading) return <div style={{ padding: 24 }}>Завантаження...</div>
  return user ? children : <Navigate to="/login" />
}

function PublicRoute({children}) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: 24 }}>Завантаження...</div>
  return user ? <Navigate to="/" /> : children
}

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