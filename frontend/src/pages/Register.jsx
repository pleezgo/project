import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import '../styles/auth.css'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.register({name, email, password})

      login(data.user, data.token)
      navigate('/')
    } catch(err) {
      console.error('register error', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-name">HealthLog</div>
          <div className="auth-logo-sub">щоденник здоров'я</div>
        </div>

        <div className="auth-title">Реєстрація</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Імʼя</label>
            <input
              className="form-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Іван Петренко"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="мінімум 6 символів"
              required
            />
          </div>

          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Завантаження...' : 'Зареєструватись'}
          </button>
        </form>

        <div className="auth-footer">
          Вже є акаунт? <Link to="/login">Увійти</Link>
        </div>
      </div>
    </div>
  )
}