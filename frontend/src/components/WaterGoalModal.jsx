import { useState } from 'react'
import { api } from '../api/api'
import { calcWaterGoal } from '../utils/hydrationUtils'

export default function WaterGoalModal({ profile, currentGoal, onClose, onSaved }) {
  const recommended = calcWaterGoal(profile?.weight, profile?.activity)
  const isCustom = profile?.water_goal !== null && profile?.water_goal !== undefined

  const [value, setValue] = useState(isCustom ? profile.water_goal : '')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    const num = +value
    if (!num || num <= 0) {
      setError('Введіть значення більше 0')
      return
    }
    if (num > 10000) {
      setError('Максимум 10000 мл')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.updateWaterGoal({ water_goal: num })
      onSaved()
    } catch (e) {
      setError(e.message || 'Помилка збереження')
    } finally {
      setLoading(false)
    }
  }

  const reset = async () => {
    setLoading(true)
    setError('')
    try {
      await api.updateWaterGoal({ water_goal: null })
      onSaved()
    } catch (e) {
      setError(e.message || 'Помилка скидання')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}
    >
      <div style={{ background:'var(--bg)', border:'1px solid var(--border)', width:'100%', maxWidth:420 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:15, fontWeight:500 }}>Налаштування цілі</div>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:18, color:'var(--text-muted)', cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ padding:20 }}>
          {error && (
            <div style={{ border:'1px solid var(--red)', padding:'8px 10px', fontSize:13, color:'var(--red)', marginBottom:12 }}>
              {error}
            </div>
          )}

          <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:12 }}>
            Автоматично розраховано на основі ваги та рівня активності: <strong style={{ color:'var(--text)' }}>{recommended} мл</strong>
          </div>

          <div className="form-group">
            <label className="form-label">Власна ціль (мл/день)</label>
            <input
              type="number"
              className="form-input"
              value={value}
              onChange={e => setValue(e.target.value)}
              min="1"
              max="10000"
              step="50"
              placeholder={`${recommended}`}
              autoFocus
            />
          </div>

          <div style={{ display:'flex', gap:8, justifyContent:'space-between', alignItems:'center', marginTop:16 }}>
            {isCustom ? (
              <button onClick={reset} disabled={loading} className="btn" style={{ fontSize:12 }}>
                Скинути до автоматичного
              </button>
            ) : <div />}

            <div style={{ display:'flex', gap:8 }}>
              <button onClick={onClose} className="btn">Скасувати</button>
              <button onClick={save} disabled={loading || !value} className="btn btn-primary">
                {loading ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}