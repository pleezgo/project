import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { today, displayDateLong } from '../utils/dateUtils'
import { calcSleepGoal, formatDuration, formatTime, generateInsights, qualityLabel } from '../utils/sleepUtils'
import { pct } from '../utils/nutritionUtils'
import DateNavigator from '../components/DateNavigator'
import SleepDayLine from '../components/SleepDayLine'
import SleepCalendar from '../components/SleepCalendar'
import SleepModal from '../components/SleepModal'
import StarRating from '../components/StarRating'

/**
 *
 */
export default function Sleep() {
  const [date, setDate] = useState(today())
  const [profile, setProfile] = useState(null)
  const [data, setData] = useState({ logs: [], night_logs: [], nap_logs: [], total_min: 0, night_min: 0, nap_min: 0 })
  const [modal, setModal] = useState(null) // null | 'new' | { ...editLog }
  const [loading, setLoading] = useState(true)

  const load = async (d) => {
    setLoading(true)
    try {
      const [p, s] = await Promise.all([
        profile ? Promise.resolve(profile) : api.getProfile(),
        api.getSleep(d),
      ])
      if (!profile) setProfile(p)
      setData(s)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(date) }, [date])

  const sleepGoal = calcSleepGoal(profile?.goal)
  const insights = generateInsights(data.logs)

  const handleDelete = async (id) => {
    try {
      await api.deleteSleep(id)
      load(date)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="empty-state">Завантаження...</div>

  const nightLog = data.night_logs?.[0] // зазвичай один нічний за день

  return (
    <div>
      {/* Шапка */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:500 }}>Сон</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{displayDateLong(date)}</div>
        </div>
        <DateNavigator date={date} onChange={setDate} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:12 }}>
        {/* Ліва панель */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Поточна доба */}
          <div className="card" style={{ marginBottom:0 }}>
            <div className="card-title">Доба сну</div>

            <SleepDayLine logs={data.logs} date={date} />

            <div style={{ marginTop:16, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {/* Загальна тривалість і прогрес */}
              <div>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>
                  Нічний сон
                </div>
                <div style={{ fontSize:22, fontWeight:500, color:'var(--accent)' }}>
                  {formatDuration(data.night_min)}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                  з {formatDuration(sleepGoal)}
                </div>
                <div style={{ height:4, background:'var(--border-light)', marginTop:6 }}>
                  <div style={{
                    height:'100%',
                    width: pct(data.night_min, sleepGoal) + '%',
                    background:'var(--accent)',
                  }}/>
                </div>
              </div>

              {/* Денний сон */}
              <div>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>
                  Денний сон
                </div>
                <div style={{ fontSize:22, fontWeight:500, color: data.nap_min > 0 ? 'var(--purple)' : 'var(--text-placeholder)' }}>
                  {data.nap_min > 0 ? formatDuration(data.nap_min) : '—'}
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:2 }}>
                  {data.nap_logs.length > 0 ? `${data.nap_logs.length} запис(ів)` : 'не було'}
                </div>
              </div>
            </div>

            {/* Якість сну (нічного) */}
            {nightLog && nightLog.quality && (
              <div style={{ marginTop:16, paddingTop:12, borderTop:'1px solid var(--border-light)' }}>
                <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
                  Якість нічного сну
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <StarRating value={nightLog.quality} readOnly size={20} />
                  <span style={{ fontSize:13, color:'var(--text-muted)' }}>
                    {qualityLabel(nightLog.quality)}
                  </span>
                </div>
              </div>
            )}

            {/* Кнопка додати */}
            <div style={{ marginTop:16 }}>
              <button onClick={() => setModal('new')} className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                + Записати сон
              </button>
            </div>
          </div>

          {/* Журнал записів */}
          {data.logs.length > 0 && (
            <div className="card" style={{ marginBottom:0 }}>
              <div className="card-title">Записи дня</div>
              {data.logs.map(log => (
                <div
                    key={log.id}
                    onClick={() => setModal(log)}
                    style={{
                    display:'grid',
                    gridTemplateColumns:'70px 1fr auto auto 24px',
                    alignItems:'center',
                    gap:10,
                    padding:'8px 0',
                    borderBottom:'1px solid var(--border-light)',
                    fontSize:13,
                    cursor:'pointer',
                    }}
                >
                    <span style={{
                    fontSize:11,
                    color: log.sleep_type === 'night' ? 'var(--accent)' : 'var(--purple)',
                    fontWeight:500,
                    textTransform:'uppercase',
                    letterSpacing:'0.05em',
                    }}>
                    {log.sleep_type === 'night' ? 'Нічний' : 'Денний'}
                    </span>
                    <span style={{ color:'var(--text-muted)' }}>
                    {formatTime(log.sleep_start)} - {formatTime(log.sleep_end)}
                    </span>
                    <span style={{ fontWeight:500 }}>
                    {formatDuration(log.duration_min)}
                    </span>
                    <span>
                    {log.quality ? <StarRating value={log.quality} readOnly size={12} /> : <span style={{ color:'var(--text-faint)', fontSize:11 }}>—</span>}
                    </span>
                    <span
                    onClick={(e) => { e.stopPropagation(); handleDelete(log.id) }}
                    style={{ cursor:'pointer', textAlign:'center', color:'var(--text-faint)' }}
                    >×</span>
                </div>
                ))}
            </div>
          )}

          {/* Підказки */}
          {insights.length > 0 && (
            <div className="card" style={{ marginBottom:0, background:'var(--bg-secondary)' }}>
              <div className="card-title">Підказки</div>
              {insights.map((text, i) => (
                <div key={i} style={{
                  fontSize:12,
                  color:'var(--text-secondary)',
                  padding:'6px 0',
                  borderBottom: i < insights.length - 1 ? '1px solid var(--border-light)' : 'none',
                }}>
                  {text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Права панель — календар */}
        <div className="card" style={{ marginBottom:0 }}>
          <div className="card-title">Календар сну</div>
          <SleepCalendar currentDate={date} onSelectDate={setDate} />
        </div>
      </div>

      {/* Модал */}
      {modal && (
        <SleepModal
          date={date}
          editLog={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(date) }}
        />
      )}
    </div>
  )
}