import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import '../styles/layout.css'

/**
 * Доступні розділи навігації застосунку.
 *
 * Використовуються для побудови основного меню в боковій панелі.
 */
const navItems = [
  {to: '/', label: 'Дашборд', end: true},
  {to: '/food', label: 'Харчування'},
  {to: '/activity', label: 'Фізична активність'},
  {to: '/hydration', label: 'Гідрація'},
  {to: '/sleep', label: 'Сон'},
]

/**
 * Майбутні розділи застосунку, які поки що недоступні в інтерфейсі.
 */
const disabledItems = [
]

/**
 * Основний макет авторизованої частини застосунку.
 *
 * Відображає бокову навігацію, інформацію про поточного користувача,
 * кнопку виходу та вкладений контент поточного маршруту через Outlet.
 * @returns {object} JSX-елемент сторінки входу.
 */
export default function Layout() {
  const {user, logout} = useAuth()
  const navigate = useNavigate()

  /**
   * Виконує вихід користувача із застосунку та перенаправляє на сторінку входу.
   * @returns {void}
   */
  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-name">HealthLog</div>
          <div className="sidebar-logo-sub">щоденник здоров'я</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Головне</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="nav-dot"></div>
              {item.label}
            </NavLink>
          ))}

          {/* <div className="nav-section">Незабаром</div> */}
          {disabledItems.map(item => (
            <div key={item.label} className="nav-item disabled">
              <div className="nav-dot"></div>
              {item.label}
              <span className="nav-lock">—</span>
            </div>
          ))}

          <div className="nav-section">Акаунт</div>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-dot"></div>
            Профіль
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            {user?.name || user?.email}
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Вийти
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}