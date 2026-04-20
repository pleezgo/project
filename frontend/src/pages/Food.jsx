/**
 * Головна бізнес-логіка сторінки щоденника харчування.
 *
 * Цей модуль поєднує кілька сценаріїв роботи
 * - завантаження записів харчування за обрану дату
 * - пошук продуктів через USDA API
 * - додавання записів до щоденника
 * - роботу з власними продуктами користувача
 * - обчислення прогресу за денними нормами
 *
 * Сторінка виступає точкою взаємодії між інтерфейсом користувача,
 * локальним станом форми та backend API, тому разом містить
 * відображення та прикладну логіку роботи з харчуванням.
 */

import { useState, useEffect} from 'react'
import { api } from '../api/api'
import { today } from '../utils/dateUtils'
import { calcMacroGoals, pct } from '../utils/nutritionUtils'
import DateNavigator from '../components/DateNavigator'
import FoodTable from '../components/FoodTable'
import FoodModal from '../components/FoodModal'

/**
 * Варіанти прийомів їжі, доступні в щоденнику харчування.
 */
const MEALS = [
  { id: 'breakfast', label: 'Сніданок' },
  { id: 'lunch', label: 'Обід' },
  { id: 'dinner', label: 'Вечеря' },
  { id: 'snack', label: 'Перекус' }
]

/**
 * Сторінка щоденника харчування.
 *
 * Завантажує записи харчування і профіль користувача за вибрану дату,
 * дозволяє шукати продукти через USDA, додавати власні продукти,
 * створювати записи харчування та видаляти їх.
 * @returns {object} SX-елемент сторінки харчування.
 */
export default function Food() {
  const [date, setDate] = useState(today())
  const [logs, setLogs] = useState([])
  const [profile, setProfile] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [currentMeal, setCurrentMeal] = useState('breakfast')

  /**
   * Завантажує записи харчування і профіль користувача за вказану дату.
   * @param {string} d Дата у форматі YYYY-MM-DD.
   * @returns {Promise<void>}
   */
  const load = async (d) => {
    try {
      const [l, p] = await Promise.all([api.getFoodLogs(d), api.getProfile()])

      setLogs(l)
      setProfile(p)
    } catch(err) {
      console.error(err)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(date)
  }, [date])

  /**
   * Видаляє запис харчування за ідентифікатором і перезавантажує дані сторінки.
   * @param {number|string} id Ідентифікатор запису харчування.
   * @returns {Promise<void>}
   */
  const deleteLog = async (id) => {
    await api.deleteFoodLog(id)
    load(date)
  }

  /**
   * Закриває модальне вікно і скидає тимчасовий стан вибору продукту та форми.
   * @returns {void}
   */
  const closeModal = () => {
    setShowModal(false)
  }

  const goals = calcMacroGoals(profile.calorie_goal)

  const total = logs.reduce((a, i) => ({
    kcal: a.kcal + (+i.kcal || 0),
    protein: a.protein + (+i.protein_g || 0),
    fat: a.fat + (+i.fat_g || 0),
    carbs: a.carbs + (+i.carbs_g || 0)
  }), {kcal: 0, protein: 0, fat: 0, carbs: 0})

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Харчування</div>
        <DateNavigator date={date} onChange={setDate} />
      </div>

      <div className="stats-row" style={{ marginBottom: 12 }}>
        {[
          ['Калорії', Math.round(total.kcal), goals.kcal, 'ккал', 'var(--accent)'],
          ['Білки', Math.round(total.protein), goals.protein, 'г', 'var(--green)'],
          ['Жири', Math.round(total.fat), goals.fat, 'г', 'var(--amber)'],
          ['Вуглеводи', Math.round(total.carbs), goals.carbs, 'г', 'var(--purple)']
        ].map(([label, val, goal, unit, color]) => (
          <div key={label} className="stat-cell">
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={{ color }}>
              {val}
              <span className="stat-unit"> {unit}</span>
            </div>
            <div className="stat-bar">
              <div className="stat-bar-fill" style={{ width: pct(val, goal) + '%', background: color }} />
            </div>
            <div className="stat-note">з {goal}{unit}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 12 }}>
        <FoodTable
          logs={logs}
          onAdd={(mealId) => { setCurrentMeal(mealId); setShowModal(true) }}
          onDelete={deleteLog}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-title">Баланс КБЖВ</div>

            {[
              ['Вуглеводи', Math.round(total.carbs), goals.carbs, 'var(--purple)'],
              ['Білки', Math.round(total.protein), goals.protein, 'var(--green)'],
              ['Жири', Math.round(total.fat), goals.fat, 'var(--amber)']
            ].map(([label, val, goal, color]) => (
              <div key={label} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ color, fontWeight: 500 }}>
                    {val}г{' '}
                    <span style={{ color: 'var(--text-faint)', fontWeight: 400, fontSize: 12 }}>
                      {pct(val, goal)}%
                    </span>
                  </span>
                </div>

                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: pct(val, goal) + '%', background: color }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-title">Підсумок дня</div>

            {[
              ['Спожито', `${Math.round(total.kcal)} ккал`],
              ['Ціль', `${goals.kcal} ккал`],
              ['Залишок', `${Math.max(0, goals.kcal - Math.round(total.kcal))} ккал`],
              ['Прийомів', `${MEALS.filter(m => logs.some(l => l.meal_type === m.id)).length} з 4`],
              ['Записів', `${logs.length}`]
            ].map(([label, val]) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border-light)'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontWeight: 500 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <FoodModal
          mealId={currentMeal}
          date={date}
          onClose={closeModal}
          onSaved={() => { closeModal(); load(date) }}
        />
      )}
    </div>
  )
}