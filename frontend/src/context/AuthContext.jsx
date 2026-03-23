import { createContext, useContext, useState, useEffect } from 'react'

/**
 * Контекст автентифікації застосунку.
 *
 * Зберігає поточного користувача, стан завантаження та методи входу і виходу.
 */
const AuthContext = createContext(null)

/**
 * Провайдер автентифікації, який керує станом користувача в застосунку.
 *
 * Під час ініціалізації відновлює користувача з localStorage, якщо збережено
 * токен і серіалізовані дані користувача. Надає дочірнім компонентам доступ
 * до user, loading, login і logout через AuthContext.
 *
 * @param {{ children: import('react').ReactNode }} props Властивості компонента.
 * @returns {import('react').JSX.Element}
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if(token && savedUser) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  /**
  * Зберігає токен і дані користувача та оновлює стан автентифікації.
  *
  * @param {Object} userData Дані авторизованого користувача.
  * @param {string} token JWT-токен доступу.
  * @returns {void}
  */
  const login = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  /**
  * Очищає дані автентифікації з localStorage і скидає поточного користувача.
  *
  * @returns {void}
  */
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Повертає значення контексту автентифікації.
 *
 * Використовується компонентами для доступу до поточного користувача,
 * стану завантаження та методів login/logout.
 *
 * @returns {{ user: Object | null, loading: boolean, login: Function, logout: Function }}
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}