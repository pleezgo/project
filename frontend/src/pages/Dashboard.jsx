import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { today, displayDateLong} from '../utils/dateUtils'
import { calcMacroGoals, pct } from '../utils/nutritionUtils'
import DateNavigator from '../components/DateNavigator'

/**
 * Відображає дашборд користувача з денними показниками харчування.
 *
 * Завантажує зведені дані за вибрану дату, обчислює цілі по калоріях
 * і макронутрієнтах та показує прогрес виконання.
 * @returns {object} JSX-елемент сторінки дашборда.
 */
export default function Dashboard() {
  const [date, setDate] = useState(today())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  /**
   * Завантажує дані дашборда за вказану дату і оновлює стан компонента.
   * @param {string} d Дата у форматі YYYY-MM-DD.
   * @returns {Promise<void>}
   */
  const load = async (d) => {
    setLoading(true)
    try {
      const dash = await api.getDashboard(d)
      setData(dash)
    } catch(e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(date) }, [date])

  if (loading) return <div className="empty-state">Завантаження...</div>
  if(!data) return null

  const { profile, food } = data
  const goals = calcMacroGoals(profile.calorie_goal)

  const kcal = Math.round(food?.kcal || 0)
  const protein = Math.round(food?.protein || 0)
  const fat = Math.round(food?.fat || 0)
  const carbs = Math.round(food?.carbs || 0)

  return (
    <div>
      {/* шапка */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:500 }}>Дашборд</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{displayDateLong(date)}</div>
        </div>
        <DateNavigator date={date} onChange={setDate} />
      </div>

      {/* статистика */}
      <div className="stats-row">
        <div className="stat-cell">
          <div className="stat-label">Спожито калорій</div>
          <div className="stat-value" style={{ color:'var(--accent)' }}>
            {kcal}<span className="stat-unit"> ккал</span>
          </div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: pct(kcal, goals.kcal) + '%', background:'var(--accent)' }}/>
          </div>
          <div className="stat-note">з {goals.kcal} ккал · залишок {Math.max(0, goals.kcal - kcal)}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label" style={{ color:'var(--text-faint)' }}>Вода</div>
          <div className="stat-value" style={{ color:'var(--text-placeholder)' }}>—</div>
          <div className="stat-bar"/>
          <div className="stat-note">незабаром</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label" style={{ color:'var(--text-faint)' }}>Сон</div>
          <div className="stat-value" style={{ color:'var(--text-placeholder)' }}>—</div>
          <div className="stat-bar"/>
          <div className="stat-note">незабаром</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Спалено калорій</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {Math.round(data.activity?.kcal_burned || 0)}<span className="stat-unit"> ккал</span>
          </div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: pct(Math.round(data.activity?.kcal_burned || 0), 500) + '%', background: 'var(--accent)' }} />
          </div>
          <div className="stat-note">активність - {Math.round(data.activity?.duration_min || 0)} хв</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">КБЖВ сьогодні</div>
          {[
            ['Калорії', kcal, goals.kcal, 'ккал', 'var(--accent)'],
            ['Білки', protein, goals.protein, 'г', 'var(--green)'],
            ['Жири', fat, goals.fat, 'г', 'var(--amber)'],
            ['Вуглеводи', carbs, goals.carbs, 'г', 'var(--purple)'],
          ].map(([label, val, goal, unit, color]) => (
            <div key={label} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:4 }}>
                <span style={{ color:'var(--text-secondary)' }}>{label}</span>
                <span style={{ color, fontWeight:500 }}>
                  {val}<span style={{ color:'var(--text-muted)', fontWeight:400 }}> / {goal}{unit}</span>
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: pct(val, goal) + '%', background: color }}/>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Інші показники</div>
          {[
            { title: 'Гідрація', rows: [['Випито', '— мл'], ['Ціль', '2000 мл'], ['Виконано', '—%']] },
            { title: 'Сон', rows: [['Тривалість', '— год'], ['Якість', '—'], ['Норма', '7–9 год']] },
            { title: 'Фізична активність', rows: [
              ['Спалено', `${Math.round(data.activity?.kcal_burned || 0)} ккал`],
              ['Вправ', `${data.activity?.count || 0}`],
              ['Тривалість', `${Math.round(data.activity?.duration_min || 0)} хв`]
            ]},
          ].map(block => (
            <div key={block.title} style={{ marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--text-placeholder)', marginBottom:6 }}>
                {block.title}
              </div>
              {block.rows.map(([label, val]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'4px 0', borderBottom:'1px solid var(--border-light)' }}>
                  <span style={{color:'var(--text-placeholder)'}}>{label}</span>
                  <span style={{color:'var(--text-placeholder)'}}>{val}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}