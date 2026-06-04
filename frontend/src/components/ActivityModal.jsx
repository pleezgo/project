import { useState } from 'react'
import { api } from '../api/api'
import { calcExerciseKcal, categoryLabel } from '../utils/activityUtils'

/**
 *
 * @param root0
 * @param root0.date
 * @param root0.exercises
 * @param root0.profile
 * @param root0.onClose
 * @param root0.onSaved
 */
export default function ActivityModal({ date, exercises, profile, onClose, onSaved }) {
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')

  // Параметри введення
  const [duration, setDuration] = useState('')
  const [distance, setDistance] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weightUsed, setWeightUsed] = useState('')
  const [intensity, setIntensity] = useState('moderate')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const numOrEmpty = (val) => val === '' ? '' : +val

  const params = {
    duration_min: +duration || 0,
    distance_km: +distance || 0,
    sets: +sets || 0,
    reps: +reps || 0,
    weight_used_kg: +weightUsed || 0,
    intensity,
  }

  const preview = selected ? calcExerciseKcal(selected, params, profile.weight) : 0

  const handleAdd = async () => {
    if (!selected) { setError('Оберіть вправу'); return }

    const dur = +duration || 0
    const dist = +distance || 0
    const setsNum = +sets || 0
    const repsNum = +reps || 0
    const weight = +weightUsed || 0

    if (selected.supports_duration && (dur <= 0 || dur > 1440)) {
      setError('Тривалість має бути від 1 до 1440 хв')
      return
    }
    if (selected.supports_distance && (dist <= 0 || dist > 500)) {
      setError('Дистанція має бути від 0 до 500 км')
      return
    }
    if (selected.supports_sets_reps) {
      if (setsNum <= 0 || setsNum > 100) {
        setError('Кількість підходів має бути від 1 до 100')
        return
      }
      if (repsNum <= 0 || repsNum > 1000) {
        setError('Кількість повторень має бути від 1 до 1000')
        return
      }
    }
    if (selected.supports_weight && (weight < 0 || weight > 500)) {
      setError('Вага навантаження має бути від 0 до 500 кг')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.addActivityLog({
        log_date: date,
        exercise_id: selected.id,
        duration_min: +duration || null,
        distance_km: +distance || null,
        sets: +sets || null,
        reps: +reps || null,
        weight_used_kg: +weightUsed || null,
        intensity,
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
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>
            {selected ? selected.name : 'Додати активність'}
          </div>
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
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Пошук вправи..."
                autoFocus
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', fontSize: 13, marginBottom: 8, outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ border: '1px solid var(--border)', maxHeight: 320, overflowY: 'auto' }}>
                {exercises.filter(ex => ex.name.toLowerCase().includes(search.toLowerCase())).map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => setSelected(ex)}
                    style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}
                  >
                    <div>{ex.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {categoryLabel(ex.category)} · MET {ex.met_moderate}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (<div>
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '10px 12px', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {categoryLabel(selected.category)} · MET {selected.met_moderate}
                </div>
              </div>

              {/* Інтенсивність — для всіх вправ що мають met_low або met_high */}
              {(selected.met_low || selected.met_high) && (
                <div className="form-group">
                  <label className="form-label">Інтенсивність</label>
                  <div style={{ display: 'flex', border: '1px solid var(--border)' }}>
                    {[
                      { id: 'low', label: 'Легка', disabled: !selected.met_low },
                      { id: 'moderate', label: 'Нормальна', disabled: false },
                      { id: 'high', label: 'Висока', disabled: !selected.met_high },
                    ].map((opt, i) => (
                      <button
                        key={opt.id}
                        onClick={() => !opt.disabled && setIntensity(opt.id)}
                        disabled={opt.disabled}
                        style={{
                          flex: 1, padding: '6px', border: 'none',
                          borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                          background: intensity === opt.id ? 'var(--bg-secondary)' : 'var(--bg)',
                          color: opt.disabled ? 'var(--text-placeholder)' : intensity === opt.id ? 'var(--text)' : 'var(--text-muted)',
                          fontSize: 12, cursor: opt.disabled ? 'not-allowed' : 'pointer'
                        }}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Дистанція — для cardio_distance */}
              {selected.supports_distance && (
                <div className="form-group">
                  <label className="form-label">Дистанція (км)</label>
                  <input
                    type="number" className="form-input"
                    value={distance}
                    onChange={e => setDistance(numOrEmpty(e.target.value))}
                    min="0" step="0.1" placeholder="5.0"
                  />
                </div>
              )}

              {/* Тривалість */}
              {selected.supports_duration && (
                <div className="form-group">
                  <label className="form-label">Тривалість (хв)</label>
                  <input
                    type="number" className="form-input"
                    value={duration}
                    onChange={e => setDuration(numOrEmpty(e.target.value))}
                    min="0" placeholder="30"
                  />
                </div>
              )}

              {/* Підходи + Повторення */}
              {selected.supports_sets_reps && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Підходи</label>
                    <input
                      type="number" className="form-input"
                      value={sets}
                      onChange={e => setSets(numOrEmpty(e.target.value))}
                      min="1" placeholder="3"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Повторення</label>
                    <input
                      type="number" className="form-input"
                      value={reps}
                      onChange={e => setReps(numOrEmpty(e.target.value))}
                      min="1" placeholder="10"
                    />
                  </div>
                </div>
              )}

              {/* Вага навантаження */}
              {selected.supports_weight && (
                <div className="form-group">
                  <label className="form-label">Вага навантаження (кг) · опційно</label>
                  <input
                    type="number" className="form-input"
                    value={weightUsed}
                    onChange={e => setWeightUsed(numOrEmpty(e.target.value))}
                    min="0" step="0.5" placeholder="0"
                  />
                </div>
              )}

              {preview > 0 && (
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