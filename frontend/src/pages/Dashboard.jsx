import { useState, useEffect } from 'react'
import { api } from '../api/api'

/**
 * Повертає поточну дату у форматі YYYY-MM-DD.
 * @returns {string} Поточна дата для використання в API-запитах і стані компонента.
 */
const today = () => new Date().toISOString().split('T')[0]

/**
 * Додає або віднімає задану кількість днів від дати у форматі YYYY-MM-DD.
 * @param {string} dateStr Базова дата у форматі YYYY-MM-DD.
 * @param {number} n Кількість днів для зміщення.
 * @returns {string} Нова дата у форматі YYYY-MM-DD.
 */
const addDays = (dateStr, n) => {
  const parts = dateStr.split('-')
  const d = new Date(+parts[0], +parts[1] - 1, +parts[2])
  d.setDate(d.getDate() + n)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Форматує дату для відображення в інтерфейсі українською мовою.
 * @param {string} dateStr Дата у форматі YYYY-MM-DD.
 * @returns {string} Локалізоване текстове представлення дати.
 */
const displayDate = (dateStr) => {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('uk-UA', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
}

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
  const calorieGoal = profile.calorie_goal || 2000
  const proteinGoal = profile.calorie_goal ? Math.round(profile.calorie_goal * 0.25 / 4) : 125
  const fatGoal = profile.calorie_goal ? Math.round(profile.calorie_goal * 0.30 / 9) : 67
  const carbsGoal = profile.calorie_goal ? Math.round(profile.calorie_goal * 0.45 / 4) : 250

  const kcal = Math.round(food?.kcal || 0)
  const protein = Math.round(food?.protein || 0)
  const fat = Math.round(food?.fat || 0)
  const carbs = Math.round(food?.carbs || 0)
  // const remaining = calorieGoal - kcal

  /**
   * Обчислює відсоток заповнення показника відносно цілі.
   * @param {number} v Поточне значення.
   * @param {number} max Цільове значення.
   * @returns {number} Відсоток у межах від 0 до 100.
   */
  const pct = (v, max) => Math.min(100, Math.round(v / (max || 1) * 100))

  return (
    <div>
      {/* шапка */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:500 }}>Дашборд</div>
          <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:2 }}>{displayDate(date)}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', border:'1px solid var(--border)' }}>
          <button
            onClick={() => setDate(d => addDays(d, -1))}
            style={{ padding:'5px 12px', border:'none', borderRight:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-secondary)', cursor:'pointer', fontSize:16 }}
          >‹</button>
          <span style={{ padding:'5px 14px', fontSize:13 }}>
            {new Date(date + 'T00:00:00').toLocaleDateString('uk-UA', { weekday:'short', day:'numeric', month:'short' })}
          </span>
          <button
            onClick={() => setDate(d => addDays(d, 1))}
            disabled={date >= today()}
            style={{ padding:'5px 12px', border:'none', borderLeft:'1px solid var(--border)', background:'var(--bg-secondary)', color:'var(--text-secondary)', cursor:'pointer', fontSize:16, opacity: date >= today() ? 0.3 : 1 }}
          >›</button>
        </div>
      </div>

      {/* статистика */}
      <div className="stats-row">
        <div className="stat-cell">
          <div className="stat-label">Калорії</div>
          <div className="stat-value" style={{ color:'var(--accent)' }}>
            {kcal}<span className="stat-unit"> ккал</span>
          </div>
          <div className="stat-bar">
            <div className="stat-bar-fill" style={{ width: pct(kcal, calorieGoal) + '%', background:'var(--accent)' }}/>
          </div>
          <div className="stat-note">з {calorieGoal} ккал · залишок {Math.max(0, calorieGoal - kcal)}</div>
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
          <div className="stat-label" style={{ color:'var(--text-faint)' }}>Тренування</div>
          <div className="stat-value" style={{ color:'var(--text-placeholder)' }}>—</div>
          <div className="stat-bar"/>
          <div className="stat-note">незабаром</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">КБЖВ сьогодні</div>
          {[
            ['Калорії', kcal, calorieGoal, 'ккал', 'var(--accent)'],
            ['Білки', protein, proteinGoal, 'г', 'var(--green)'],
            ['Жири', fat, fatGoal, 'г', 'var(--amber)'],
            ['Вуглеводи', carbs, carbsGoal, 'г', 'var(--purple)'],
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
          <div className="card-title">Плейхолдери</div>
          {[
            { title: 'Гідрація', rows: [['Випито', '— мл'], ['Ціль', '2000 мл'], ['Виконано', '—%']] },
            { title: 'Сон', rows: [['Тривалість', '— год'], ['Якість', '—'], ['Норма', '7–9 год']] },
            { title: 'Тренування', rows: [['Спалено', '— ккал'], ['Вправ', '—'], ['Тривалість', '— хв']] },
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