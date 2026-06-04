import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { useAuth } from '../context/AuthContext'

const EMPTY_EXERCISE = {
  name: '',
  category: 'cardio_distance',
  met_low: '',
  met_moderate: '',
  met_high: '',
  supports_distance: false,
  supports_duration: false,
  supports_sets_reps: false,
  supports_weight: false,
  seconds_per_rep: '',
}

const CATEGORY_LABELS = {
  cardio_distance: 'Кардіо з дистанцією',
  cardio_time: 'Кардіо за часом',
  isometric: 'Ізометричні',
  bodyweight_reps: 'Силові з власною вагою',
  weighted_reps: 'Силові з обтяженням',
}

const Admin = () => {
  const { user } = useAuth()
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showExForm, setShowExForm] = useState(false)
  const [exForm, setExForm] = useState(EMPTY_EXERCISE)
  const [resetResult, setResetResult] = useState(null)

useEffect(() => {
  loadAll()
}, [])

const loadAll = async () => {
  setLoading(true)
  setError('')
  try {
    const [usersData, exData] = await Promise.all([
      api.getAllUsers(),
      api.getAllExercises(),
    ])
    setUsers(usersData)
    setExercises(exData)
  } catch (e) {
    setError(e.message || 'Помилка завантаження')
  } finally {
    setLoading(false)
  }
}

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      if (tab === 'users') {
        const data = await api.getAllUsers()
        setUsers(data)
      } else {
        const data = await api.getAllExercises()
        setExercises(data)
      }
    } catch (e) {
      setError(e.message || 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (u) => {
    if (!window.confirm(`Видалити користувача ${u.email}? Усі його записи буде видалено.`)) return
    try {
      await api.deleteUser(u.id)
      setUsers(prev => prev.filter(x => x.id !== u.id))
    } catch (e) {
      setError(e.message || 'Помилка видалення')
    }
  }

  const handleResetPassword = async (u) => {
    if (!window.confirm(`Скинути пароль для ${u.email}? Буде згенеровано новий тимчасовий пароль.`)) return
    try {
      const result = await api.resetUserPassword(u.id)
      setResetResult(result)
    } catch (e) {
      setError(e.message || 'Помилка скидання пароля')
    }
  }

  const handleDeleteExercise = async (ex) => {
    if (!window.confirm(`Видалити вправу "${ex.name}"?`)) return
    try {
      await api.deleteExercise(ex.id)
      setExercises(prev => prev.filter(x => x.id !== ex.id))
    } catch (e) {
      setError(e.message || 'Помилка видалення')
    }
  }

  const handleAddExercise = async () => {
    setError('')
    if (!exForm.name.trim() || !exForm.met_moderate) {
      setError('Назва та MET (moderate) обовʼязкові')
      return
    }
    try {
      const newEx = await api.addExercise({
        ...exForm,
        met_low: exForm.met_low === '' ? null : +exForm.met_low,
        met_moderate: +exForm.met_moderate,
        met_high: exForm.met_high === '' ? null : +exForm.met_high,
        seconds_per_rep: exForm.seconds_per_rep === '' ? null : +exForm.seconds_per_rep,
      })
      setExercises(prev => [...prev, newEx])
      setExForm(EMPTY_EXERCISE)
      setShowExForm(false)
    } catch (e) {
      setError(e.message || 'Помилка додавання')
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>Адміністрування</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => setTab('users')}
          style={{
            padding: '8px 16px', background: 'none',
            border: 'none', cursor: 'pointer',
            borderBottom: tab === 'users' ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: tab === 'users' ? 600 : 400,
          }}
        >
          Користувачі ({users.length})
        </button>
        <button
          onClick={() => setTab('exercises')}
          style={{
            padding: '8px 16px', background: 'none',
            border: 'none', cursor: 'pointer',
            borderBottom: tab === 'exercises' ? '2px solid var(--accent)' : '2px solid transparent',
            fontWeight: tab === 'exercises' ? 600 : 400,
          }}
        >
          Довідник вправ ({exercises.length})
        </button>
      </div>

      {error && (
        <div style={{ padding: 10, marginBottom: 12, color: 'var(--red)', background: 'var(--bg-secondary)', fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Завантаження...</div>
      ) : tab === 'users' ? (
        <div className="card">
          <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 60px 80px 120px 100px', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            <span>ID</span>
            <span>Email</span>
            <span>Імʼя</span>
            <span>Роль</span>
            <span>Записи</span>
            <span>Реєстрація</span>
            <span></span>
          </div>
          {users.map(u => (
            <div key={u.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 60px 80px 120px 100px', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--border-light)', fontSize: 13, alignItems: 'center' }}>
              <span>{u.id}</span>
              <span>{u.email}</span>
              <span>{u.name || '-'}</span>
              <span style={{ color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-muted)' }}>
                {u.role}
              </span>
              <span title={`Х:${u.food_count} А:${u.activity_count} Г:${u.hydration_count} С:${u.sleep_count}`}>
                {Number(u.food_count) + Number(u.activity_count) + Number(u.hydration_count) + Number(u.sleep_count)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date(u.created_at).toLocaleDateString('uk-UA')}
              </span>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => handleResetPassword(u)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--accent)', fontSize: 12,
                    padding: '0 6px',
                  }}
                  title="Скинути пароль"
                >
                  Скинути
                </button>
                <button
                  onClick={() => handleDeleteUser(u)}
                  disabled={u.id === user?.id}
                  style={{
                    background: 'none', border: 'none',
                    cursor: u.id === user?.id ? 'not-allowed' : 'pointer',
                    color: u.id === user?.id ? 'var(--text-muted)' : 'var(--red)',
                    fontSize: 14,
                  }}
                  title={u.id === user?.id ? 'Не можна видалити себе' : 'Видалити'}
                >
                  ✕
                </button>
              </div>
            </div>
            
          ))}
          {users.length === 0 && (
            <div style={{ padding: 16, color: 'var(--text-muted)', textAlign: 'center' }}>
              Користувачів немає
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowExForm(s => !s)}
              className="btn btn-primary"
            >
              {showExForm ? 'Скасувати' : '+ Додати вправу'}
            </button>
          </div>

          {showExForm && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">Нова вправа</div>

              <div className="form-group">
                <label className="form-label">Назва</label>
                <input className="form-input"
                  value={exForm.name}
                  onChange={e => setExForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Біг на 5 км" />
              </div>

              <div className="form-group">
                <label className="form-label">Категорія</label>
                <select className="form-input"
                  value={exForm.category}
                  onChange={e => setExForm(f => ({ ...f, category: e.target.value }))}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">MET (low)</label>
                  <input type="number" className="form-input" step="0.1" min="0" max="30"
                    value={exForm.met_low}
                    onChange={e => setExForm(f => ({ ...f, met_low: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">MET (moderate)*</label>
                  <input type="number" className="form-input" step="0.1" min="0" max="30"
                    value={exForm.met_moderate}
                    onChange={e => setExForm(f => ({ ...f, met_moderate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">MET (high)</label>
                  <input type="number" className="form-input" step="0.1" min="0" max="30"
                    value={exForm.met_high}
                    onChange={e => setExForm(f => ({ ...f, met_high: e.target.value }))} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Підтримуване</label>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    ['supports_distance', 'Дистанція'],
                    ['supports_duration', 'Тривалість'],
                    ['supports_sets_reps', 'Підходи/повтори'],
                    ['supports_weight', 'Вага'],
                  ].map(([k, label]) => (
                    <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                      <input type="checkbox"
                        checked={exForm[k]}
                        onChange={e => setExForm(f => ({ ...f, [k]: e.target.checked }))} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {(exForm.supports_sets_reps) && (
                <div className="form-group">
                  <label className="form-label">Секунд на повторення</label>
                  <input type="number" className="form-input" min="1" max="60"
                    value={exForm.seconds_per_rep}
                    onChange={e => setExForm(f => ({ ...f, seconds_per_rep: e.target.value }))}
                    placeholder="3" />
                </div>
              )}

              <button onClick={handleAddExercise} className="btn btn-primary">Додати</button>
            </div>
          )}

          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 100px 60px', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--border)', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              <span>ID</span>
              <span>Назва</span>
              <span>Категорія</span>
              <span>MET</span>
              <span></span>
            </div>
            {exercises.map(ex => (
              <div key={ex.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 100px 60px', gap: 8, padding: '8px 4px', borderBottom: '1px solid var(--border-light)', fontSize: 13, alignItems: 'center' }}>
                <span>{ex.id}</span>
                <span>{ex.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {CATEGORY_LABELS[ex.category] || ex.category}
                </span>
                <span style={{ fontSize: 12 }}>
                  {ex.met_low || '-'}/{ex.met_moderate}/{ex.met_high || '-'}
                </span>
                <button
                  onClick={() => handleDeleteExercise(ex)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 14 }}
                  title="Видалити"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {resetResult && (
        <div
          onClick={() => setResetResult(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg)', padding: 24,
              border: '1px solid var(--border)',
              maxWidth: 420, width: '90%',
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 12, fontWeight: 600 }}>
              Пароль скинуто
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
              Користувач: <strong style={{ color: 'var(--text)' }}>{resetResult.email}</strong>
            </div>
            <div style={{ fontSize: 13, marginBottom: 8 }}>Новий пароль:</div>
            <div
              style={{
                fontFamily: 'monospace', fontSize: 18,
                padding: '10px 14px', background: 'var(--bg-secondary)',
                marginBottom: 12, userSelect: 'all', letterSpacing: 2,
              }}
            >
              {resetResult.new_password}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>
              Передайте цей пароль користувачу. 
              Він не зберігається і не може бути отриманий повторно.
            </div>
            <button onClick={() => setResetResult(null)} className="btn btn-primary">
              Закрити
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Admin