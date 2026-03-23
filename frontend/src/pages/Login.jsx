import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/api'
import '../styles/auth.css'

/**
 * Сторінка входу користувача в застосунок.
 *
 * Дозволяє авторизуватись за email і паролем, зберігає стан завантаження
 * та відображає повідомлення про помилку у разі неуспішного входу.
 *
 * @returns {import('react').JSX.Element}
 */
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  /**
   * Обробляє надсилання форми входу.
   *
   * Виконує автентифікацію через API, зберігає користувача і токен
   * через AuthContext та перенаправляє на головну сторінку.
   *
   * @param {import('react').SubmitEvent<HTMLFormElement>} e Подія надсилання форми.
   * @returns {Promise<void>}
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await api.login({ email, password })
      login(data.user, data.token)
      navigate('/')
    } catch(err) {
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

        <div className="auth-title">Вхід</div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
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
              placeholder="******"
              required
            />
          </div>

          <button
            className="btn btn-primary w-full"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Завантаження...' : 'Увійти'}
          </button>
        </form>

        <div className="auth-footer">
          Немає акаунту? <Link to="/register">Зареєструватись</Link>
        </div>
      </div>
    </div>
  )
}