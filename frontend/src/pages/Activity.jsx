import ActivityModal from '../components/ActivityModal'
import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { today } from '../utils/dateUtils'
import { pct } from '../utils/nutritionUtils'
import DateNavigator from '../components/DateNavigator'

export default function Activity() {
  const [date, setDate] = useState(today())
  const [logs, setLogs] = useState([])
  const [exercises, setExercises] = useState([])
  const [profile, setProfile] = useState({})
  const [weight, setWeight] = useState('')
  const [savedWeight, setSavedWeight] = useState(null)
  const [modal, setModal] = useState(false)

  const load = async (d) => {
    try {
      const [l, ex, p, w] = await Promise.all([
        api.getActivityLogs(d),
        api.getExercises(),
        api.getProfile(),
        api.getWeightLog(d),
      ])
      setLogs(l)
      setExercises(ex)
      setProfile(p)
      setSavedWeight(w)
      setWeight(w ? w.weight : '')
    } catch (err) {
      console.error(err)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(date) }, [date])
  const totalKcal = Math.round(logs.reduce((s, l) => s + (+l.kcal_burned || 0), 0))
  const totalDuration = Math.round(logs.reduce((s, l) => s + (+l.duration_min || 0), 0))

  const handleDelete = async (id) => {
    await api.deleteActivityLog(id)
    load(date)
  }

  const handleWeightSave = async () => {
    if (!weight) return
    try {
      const w = await api.addWeightLog({ log_date: date, weight: +weight })
      setSavedWeight(w)
    } catch (err) {
      console.error(err)
    }
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500 }}>Фізична активність</div>
        </div>
        <DateNavigator date={date} onChange={setDate} />
      </div>

      {/* Статистика */}
      <div className="stats-row">
        <div className="stat-cell">
          <div className="stat-label">Спалено</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {totalKcal}<span className="stat-unit"> ккал</span>
          </div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: pct(totalKcal, 500) + '%', background: 'var(--accent)' }} />
          </div>
          <div className="stat-note">за сьогодні</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Кардіо</div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>
            {totalDuration}<span className="stat-unit"> хв</span>
          </div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: pct(totalDuration, 60) + '%', background: 'var(--red)' }} />
          </div>
          <div className="stat-note">за сьогодні</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label" style={{ color: 'var(--text-faint)' }}>Силові</div>
          <div className="stat-value" style={{ color: 'var(--text-placeholder)' }}>—</div>
          <div className="stat-bar" />
          <div className="stat-note">незабаром</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Активностей загалом</div>
          <div className="stat-value">{logs.length}</div>
          <div className="stat-note">за сьогодні</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
      {/* Список активності */}
      <div style={{ border: '1px solid var(--border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px', padding: '8px 0', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
        <span style={{ padding: '0 8px 0 12px', fontSize: 13, fontWeight: 500 }}>Кардіо</span>
        <span style={{ padding: '0 8px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', textAlign: 'right' }}>{totalDuration} хв</span>
        <span style={{ padding: '0 8px', fontSize: 10, color: 'var(--text-muted)', textAlign: 'right' }}>{totalKcal} ккал</span>
        <button
          onClick={() => setModal(true)}
          style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', padding: '0 8px' }}
        >+ додати</button>
      </div>

        {logs.length === 0 && (
          <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-faint)' }}>Немає записів</div>
        )}

        {logs.map(log => (
          <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px', borderTop: '1px solid var(--border-light)', alignItems: 'center' }}>
            <div style={{ padding: '7px 8px 7px 12px', fontSize: 13 }}>{log.exercise_name}</div>
            <div style={{ padding: '7px 8px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'right' }}>{log.duration_min} хв</div>
            <div style={{ padding: '7px 8px', fontSize: 12, color: 'var(--accent)', fontWeight: 500, textAlign: 'right' }}>{Math.round(log.kcal_burned)} ккал</div>
            <div onClick={() => handleDelete(log.id)} style={{ padding: '7px 8px', fontSize: 12, color: 'var(--text-faint)', cursor: 'pointer', textAlign: 'center' }}>×</div>
          </div>
        ))}

        {/* Плейсхолдер силові */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 80px', padding: '8px 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
          <span style={{ padding: '0 8px 0 12px', fontSize: 13, fontWeight: 500, color: 'var(--text-placeholder)' }}>Силові</span>
          <div />
          <span style={{ padding: '0 8px', fontSize: 12, color: 'var(--text-placeholder)', textAlign: 'right' }}>— ккал</span>
          <span style={{ padding: '0 8px', fontSize: 12, color: 'var(--text-placeholder)', textAlign: 'right' }}>незабаром</span>
        </div>
      </div>

      {/* Бічна панель */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Вага сьогодні</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="number"
              className="form-input"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="кг"
              step="0.1"
            />
            <button onClick={handleWeightSave} className="btn btn-primary">
              {savedWeight ? 'Оновити' : 'Зберегти'}
            </button>
          </div>
          {savedWeight && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Збережено: {savedWeight.weight} кг
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Підсумок дня</div>
          {[
            ['Спалено', `${totalKcal} ккал`],
            ['Вправ', `${logs.length}`],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
              <span style={{ fontWeight: 500 }}>{val}</span>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Власні вправи</div>
          <div style={{ fontSize: 12, color: 'var(--text-placeholder)', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
            Тут будуть ваші вправи
          </div>
          <button disabled style={{ marginTop: 8, fontSize: 12, color: 'var(--text-placeholder)', background: 'none', border: '1px solid var(--border)', padding: '4px 10px', cursor: 'not-allowed', width: '100%' }}>
            + додати вправу
          </button>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Набори вправ</div>
          <div style={{ fontSize: 12, color: 'var(--text-placeholder)', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
            Тут будуть ваші набори
          </div>
          <button disabled style={{ marginTop: 8, fontSize: 12, color: 'var(--text-placeholder)', background: 'none', border: '1px solid var(--border)', padding: '4px 10px', cursor: 'not-allowed', width: '100%' }}>
            + створити набір
          </button>
        </div>
      </div>
    </div>
    {/* Історія за тиждень */}
    <div className="card" style={{ marginTop: 12 }}>
      <div className="card-title">Історія активності за тиждень</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', borderBottom: '1px solid var(--border-light)', paddingBottom: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Дата</span>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', textAlign: 'right' }}>Хв</span>
        <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', textAlign: 'right' }}>Ккал</span>
      </div>
      {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(day => (
        <div key={day} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', padding: '5px 0', borderBottom: '1px solid var(--border-light)' }}>
          <span style={{ fontSize: 12, color: 'var(--text-placeholder)' }}>{day}</span>
          <span style={{ fontSize: 12, color: 'var(--text-placeholder)', textAlign: 'right' }}>—</span>
          <span style={{ fontSize: 12, color: 'var(--text-placeholder)', textAlign: 'right' }}>—</span>
        </div>
      ))}
      <div style={{ fontSize: 11, color: 'var(--text-placeholder)', marginTop: 8, textAlign: 'right' }}>незабаром</div>
    </div>
    {modal && (
      <ActivityModal
        date={date}
        exercises={exercises}
        profile={profile}
        onClose={() => setModal(false)}
        onSaved={() => { setModal(false); load(date) }}
      />
    )}
  </div>
  )
}