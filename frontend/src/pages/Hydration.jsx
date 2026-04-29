import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { today, displayDateLong } from '../utils/dateUtils'
import { calcWaterGoal, formatLogTime } from '../utils/hydrationUtils'
import DateNavigator from '../components/DateNavigator'
import HydrationBottle from '../components/HydrationBottle'
import WaterGoalModal from '../components/WaterGoalModal'

const QUICK_AMOUNTS = [100, 200, 250, 500]

export default function Hydration() {
  const [date, setDate] = useState(today())
  const [profile, setProfile] = useState(null)
  const [data, setData] = useState({ logs: [], total_ml: 0, count: 0 })
  const [customAmount, setCustomAmount] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showGoalModal, setShowGoalModal] = useState(false)

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
          <HydrationBottle current={data.total_ml} goal={goal} />
          <div style={{ textAlign:'center', marginTop:-8 }}>
            <button
                onClick={() => setShowGoalModal(true)}
                style={{ background:'none', border:'none', color:'var(--text-muted)', fontSize:12, cursor:'pointer', textDecoration:'underline' }}
            >
                Налаштувати ціль
            </button>
          </div>

          {error && (
            <div style={{ border:'1px solid var(--red)', padding:'8px 10px', fontSize:13, color:'var(--red)', marginTop:12 }}>
              {error}
            </div>
          )}

          {/* Швидкі кнопки */}
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-muted)', marginBottom:8 }}>
              Швидке додавання
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
              {QUICK_AMOUNTS.map(ml => (
                <button
                  key={ml}
                  onClick={() => handleAdd(ml)}
                  className="btn"
                  style={{ padding:'10px 0', fontSize:13, justifyContent:'center'  }}
                >
                  + {ml} мл
                </button>
              ))}
            </div>
          </div>

          {/* Ручний ввод */}
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
            currentGoal={goal}
            onClose={() => setShowGoalModal(false)}
            onSaved={() => { setShowGoalModal(false); setProfile(null); load(date) }}
        />
       )}
    </div>
  )
}