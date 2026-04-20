import { useState } from 'react'
import { api } from '../api/api'

export default function ActivityModal({ date, exercises, profile, onClose, onSaved }) {
  const [selected, setSelected] = useState(null)
  const [duration, setDuration] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const calcKcal = (ex, min) => {
    const weight = profile.weight || 70
    return Math.round(ex.met * 3.5 * weight / 200 * min)
  }

  const preview = selected && duration > 0 ? calcKcal(selected, duration) : null

  const handleAdd = async () => {
    if (!selected) { setError('Оберіть вправу'); return }
    if (!duration || duration <= 0) { setError('Введіть тривалість'); return }
    setLoading(true)
    setError('')
    try {
      await api.addActivityLog({
        log_date: date,
        exercise_id: selected.id,
        exercise_name: selected.name,
        duration_min: +duration,
        kcal_burned: calcKcal(selected, +duration),
      })
      onSaved()
    } catch (e) {
      setError(e.message || 'Помилка збереження')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
    >
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Додати активність</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {error && (
            <div style={{ border: '1px solid var(--red)', padding: '8px 10px', fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>
              {error}
            </div>
          )}

          {!selected ? (
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Оберіть вправу:</div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Пошук вправи..."
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', fontSize: 13, marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
                />
              <div style={{ border: '1px solid var(--border)', maxHeight: 280, overflowY: 'auto' }}>
                {exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase())).map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => setSelected(ex)}
                    style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}
                  >
                    <div>{ex.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>MET {ex.met}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>MET {selected.met}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Тривалість (хв)</label>
                <input
                  type="number"
                  className="form-input"
                  value={duration}
                  onChange={e => {
                    const val = e.target.value
                    setDuration(val === '' ? '' : +val)
                  }}
                  min="1"
                  placeholder="30"
                />
              </div>

              {preview && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                  ≈ {preview} ккал
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setSelected(null)} className="btn">← Назад</button>
                <button onClick={handleAdd} disabled={loading} className="btn btn-primary">
                  {loading ? 'Збереження...' : 'Додати'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}