import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { today, displayDateLong } from '../utils/dateUtils'
import { calcWaterGoal, formatLogTime } from '../utils/hydrationUtils'
import DateNavigator from '../components/DateNavigator'
import HydrationBottle from '../components/HydrationBottle'
import WaterGoalModal from '../components/WaterGoalModal'

const DEFAULT_QUICK_AMOUNTS = [100, 200, 250, 500]
const MAX_CUSTOM_AMOUNTS = 4

/**
 *
 */
export default function Hydration() {
  const [date, setDate] = useState(today())
  const [profile, setProfile] = useState(null)
  const [data, setData] = useState({ logs: [], total_ml: 0, count: 0 })
  const [customAmount, setCustomAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editAmounts, setEditAmounts] = useState([])
  const [newAmount, setNewAmount] = useState('')
  const [editError, setEditError] = useState('')

  const load = async (d) => {
    setLoading(true)
    try {
      const [p, h] = await Promise.all([
        profile ? Promise.resolve(profile) : api.getProfile(),
        api.getHydration(d),
      ])
      if (!profile) setProfile(p)
      setData(h)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(date) }, [date])

  const goal = profile?.water_goal || calcWaterGoal(profile?.weight, profile?.activity)
  const customAmounts = profile?.preferences?.water_quick_amounts || []

  const handleAdd = async (amount) => {
    const value = +amount
    if (!value || value <= 0) {
      setError('Кількість має бути більше 0')
      return
    }
    if (value > 5000) {
      setError('Максимум 5000 мл за раз')
      return
    }

    setError('')
    try {
      await api.addHydration({ log_date: date, amount_ml: value })
      setCustomAmount('')
      load(date)
    } catch (e) {
      setError(e.message || 'Помилка збереження')
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.deleteHydration(id)
      load(date)
    } catch (e) {
      console.error(e)
    }
  }
  
  const startEdit = () => {
  setEditAmounts([...customAmounts])
  setNewAmount('')
  setEditError('')
  setEditMode(true)
}

const cancelEdit = () => {
  setEditMode(false)
  setEditError('')
}

const saveEdit = async () => {
  // Якщо нічого не змінилось — просто закрити
  const same = editAmounts.length === customAmounts.length
    && editAmounts.every((v, i) => v === customAmounts[i])
  if (same) {
    setEditMode(false)
    return
  }
  try {
    await api.updateWaterQuickAmounts({ water_quick_amounts: editAmounts })
    const p = await api.getProfile()
    setProfile(p)
    setEditMode(false)
  } catch (e) {
    setEditError(e.message || 'Помилка збереження')
  }
}

const addAmount = () => {
  setEditError('')
  const value = +newAmount
  if (!Number.isInteger(value) || value <= 0) {
    setEditError('Введіть ціле число більше 0')
    return
  }
  if (value > 5000) {
    setEditError('Максимум 5000 мл')
    return
  }
  if (editAmounts.includes(value)) {
    setEditError('Це значення вже додано')
    return
  }
  if (DEFAULT_QUICK_AMOUNTS.includes(value)) {
    setEditError('Це значення вже є серед стандартних кнопок')
    return
  }
  if (editAmounts.length >= MAX_CUSTOM_AMOUNTS) {
    setEditError(`Максимум ${MAX_CUSTOM_AMOUNTS} власних кнопок`)
    return
  }
  setEditAmounts([...editAmounts, value].sort((a, b) => a - b))
  setNewAmount('')
}

const removeAmount = (value) => {
  setEditAmounts(editAmounts.filter(v => v !== value))
  setEditError('')
}

  if (loading) return <div className="empty-state">Завантаження...</div>

  return (
    <div>
      {/* Шапка */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:500 }}>Гідрація</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{displayDateLong(date)}</div>
        </div>
        <DateNavigator date={date} onChange={setDate} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:12 }}>
        {/* Ліва панель — пляшка і дії */}
        <div className="card" style={{ marginBottom:0 }}>
        <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:24, alignItems:'start' }}>
          <div>
            <HydrationBottle current={data.total_ml} goal={goal} />
          <div style={{ textAlign:'center', marginTop:-8 }}>
            <button
                onClick={() => setShowGoalModal(true)}
                style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer', textDecoration:'underline' }}
            >
                Налаштувати ціль
            </button>
          </div>
            </div>

            <div>
          {error && (
            <div style={{ border:'1px solid var(--red)', padding:'8px 10px', fontSize:13, color:'var(--red)', marginTop:12 }}>
              {error}
            </div>
          )}

        {/* Швидке додавання */}
        <div style={{ marginTop:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
            <div style={{ fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-muted)' }}>
              Швидке додавання
            </div>
            {!editMode ? (
              <button
                onClick={startEdit}
                style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer', textDecoration:'underline' }}
              >
                Редагувати
              </button>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <button
                  onClick={cancelEdit}
                  style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer' }}
                >
                  Скасувати
                </button>
                <button
                  onClick={saveEdit}
                  style={{ background:'none', border:'none', color:'var(--accent)', fontSize:12, cursor:'pointer', fontWeight:500 }}
                >
                  Готово
                </button>
              </div>
            )}
          </div>

          {editError && (
            <div style={{ border:'1px solid var(--red)', padding:'6px 10px', fontSize:12, color:'var(--red)', marginBottom:8 }}>
              {editError}
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
            {DEFAULT_QUICK_AMOUNTS.map(ml => (
              <button
                key={`default-${ml}`}
                onClick={() => handleAdd(ml)}
                className="btn"
                style={{ padding:'10px 0', fontSize:13, justifyContent:'center', opacity: editMode ? 0.4 : 1 }}
                disabled={editMode}
              >
                + {ml} мл
              </button>
            ))}

            {!editMode
              ? customAmounts.map(ml => (
                  <button
                    key={`custom-${ml}`}
                    onClick={() => handleAdd(ml)}
                    className="btn"
                    style={{ padding:'10px 0', fontSize:13, justifyContent:'center' }}
                  >
                    + {ml} мл
                  </button>
                ))
              : editAmounts.map(ml => (
                  <div
                    key={`edit-${ml}`}
                    style={{
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'space-between',
                      padding:'10px 10px',
                      border:'1px solid var(--border)',
                      fontSize:13,
                      color:'var(--text-secondary)',
                    }}
                  >
                    <span>{ml} мл</span>
                    <span
                      onClick={() => removeAmount(ml)}
                      style={{ cursor:'pointer', color:'var(--text-faint)', fontSize:14, lineHeight:1 }}
                    >×</span>
                  </div>
                ))
            }
          </div>

          {editMode && editAmounts.length < MAX_CUSTOM_AMOUNTS && (
            <div style={{ marginTop:8, display:'flex', gap:8 }}>
              <input
                type="number"
                className="form-input"
                value={newAmount}
                onChange={e => setNewAmount(e.target.value)}
                placeholder="Кількість для нової кнопки (мл)"
                min="1"
                max="5000"
                onKeyDown={e => e.key === 'Enter' && addAmount()}
                style={{ flex:1 }}
              />
              <button onClick={addAmount} className="btn" disabled={!newAmount}>
                Додати
              </button>
            </div>
          )}
        </div>

        {/* Ручний ввод */}
          {!editMode && (
          <div style={{ marginTop:16, display:'flex', gap:8 }}>
            <input
              type="number"
              className="form-input"
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              placeholder="Своя кількість (мл)"
              min="1"
              max="5000"
              style={{ flex:1 }}
            />
            <button
              onClick={() => handleAdd(customAmount)}
              className="btn btn-primary"
              disabled={!customAmount}
            >
              Додати
            </button>
          </div>
          )}
          </div>
        </div>
        </div>

        {/* Права панель — журнал */}
        <div className="card" style={{ marginBottom:0 }}>
          <div className="card-title">Журнал дня</div>

          {data.logs.length === 0 ? (
            <div style={{ fontSize:13, color:'var(--text-faint)', padding:'12px 0' }}>
              Немає записів
            </div>
          ) : (
            data.logs.map(log => (
              <div
                key={log.id}
                style={{
                  display:'grid',
                  gridTemplateColumns:'60px 1fr 24px',
                  alignItems:'center',
                  padding:'8px 0',
                  borderBottom:'1px solid var(--border-light)',
                  fontSize:13,
                }}
              >
                <span style={{ color:'var(--text-muted)', fontSize:12 }}>
                  {formatLogTime(log.logged_at)}
                </span>
                <span style={{ color:'var(--accent)', fontWeight:500 }}>
                  {log.amount_ml} мл
                </span>
                <span
                  onClick={() => handleDelete(log.id)}
                  style={{ cursor:'pointer', textAlign:'center', color:'var(--text-faint)' }}
                >
                  ×
                </span>
              </div>
            ))
          )}

          {/* Підсумок */}
          <div style={{ marginTop:12, padding:'8px 0', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', fontSize:13 }}>
            <span style={{ color:'var(--text-muted)' }}>Усього записів</span>
            <span style={{ fontWeight:500 }}>{data.count}</span>
          </div>
        </div>
      </div>

      {showGoalModal && (
        <WaterGoalModal
            profile={profile}
            onClose={() => setShowGoalModal(false)}
            onSaved={() => { setShowGoalModal(false); setProfile(null); load(date) }}
        />
       )}
    </div>
  )
}