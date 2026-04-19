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

import { useState, useEffect, useRef } from 'react'
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

const COLS = '1fr 44px 44px 44px 44px 60px 24px'

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
  const [tab, setTab] = useState('search')
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedFood, setSelectedFood] = useState(null)
  const [amount, setAmount] = useState(100)
  const [customForm, setCustomForm] = useState({
    name: '',
    kcal_per100: '',
    protein_per100: '',
    fat_per100: '',
    carbs_per100: '',
    amount: 100,
  })
  const searchTimer = useRef(null)

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
   * Оновлює пошуковий запит і запускає відкладений пошук продуктів через API.
   *
   * Використовує debounce через setTimeout, щоб не надсилати запит
   * на кожне натискання клавіші.
   * @param {string} q Пошуковий рядок.
   * @returns {void}
   */
  const handleSearch = (q) => {
    setSearchQ(q)
    clearTimeout(searchTimer.current)

    if(!q.trim()) {
      setSearchResults([])
      return
    }

    searchTimer.current = setTimeout(async () => {
      try {
        const results = await api.searchFood(q)

        setSearchResults(results.slice(0, 8))
      } catch {
        setSearchResults([])
      }
    }, 400)
  }

  /**
   * Додає вибраний продукт із результатів пошуку до щоденника харчування.
   *
   * Перераховує харчові значення відповідно до вибраної кількості грамів,
   * створює запис через API, закриває модальне вікно і оновлює список.
   * @returns {Promise<void>}
   */
  const addSelected = async () => {
    if(!selectedFood) return

    const k = amount / 100

    await api.addFoodLog({
      log_date: date,
      meal_type: currentMeal,
      food_name: selectedFood.name,
      amount_g: amount,
      kcal: Math.round((selectedFood.kcal_per100 || 0) * k),
      protein_g: +((selectedFood.protein_per100 || 0) * k).toFixed(1),
      fat_g: +((selectedFood.fat_per100 || 0) * k).toFixed(1),
      carbs_g: +((selectedFood.carbs_per100 || 0) * k).toFixed(1),
      usda_fdc_id: selectedFood.fdcId ? String(selectedFood.fdcId) : null
    })

    closeModal()
    load(date)
  }

  /**
   * Додає власний продукт до щоденника і зберігає його в персональному списку користувача.
   *
   * Використовує дані з форми customForm, обчислює харчові значення
   * для вибраної кількості та після успішного створення оновлює стан сторінки.
   * @returns {Promise<void>}
   */
  const addCustom = async () => {
    const { name, kcal_per100, protein_per100, fat_per100, carbs_per100, amount: amt } = customForm

    if (!name || !kcal_per100) return

    const k = (amt || 100) / 100

    await api.addFoodLog({
      log_date: date,
      meal_type: currentMeal,
      food_name: name,
      amount_g: amt || 100,
      kcal: Math.round(+kcal_per100 * k),
      protein_g: +((+protein_per100 || 0) * k).toFixed(1),
      fat_g: +((+fat_per100 || 0) * k).toFixed(1),
      carbs_g: +((+carbs_per100 || 0) * k).toFixed(1)
    })

    await api.addCustomFood({
      name,
      kcal_per100: +kcal_per100,
      protein_per100: +(protein_per100 || 0),
      fat_per100: +(fat_per100 || 0),
      carbs_per100: +(carbs_per100 || 0)
    })

    closeModal()
    load(date)
  }

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
   * Відкриває модальне вікно додавання їжі для вибраного прийому їжі
   * та скидає допоміжний стан форми пошуку.
   * @param {string} meal Ідентифікатор прийому їжі.
   * @returns {void}
   */
  const openModal = (meal) => {
    setCurrentMeal(meal)
    setShowModal(true)
    setTab('search')
    setSelectedFood(null)
    setSearchQ('')
    setSearchResults([])
    setAmount(100)
  }

  /**
   * Закриває модальне вікно і скидає тимчасовий стан вибору продукту та форми.
   * @returns {void}
   */
  const closeModal = () => {
    setShowModal(false)
    setSelectedFood(null)
    setSearchQ('')
    setSearchResults([])
    setCustomForm({
      name: '',
      kcal_per100: '',
      protein_per100: '',
      fat_per100: '',
      carbs_per100: '',
      amount: 100
    })
  }

  const goals = calcMacroGoals(profile.calorie_goal)

  const total = logs.reduce((a, i) => ({
    kcal: a.kcal + (+i.kcal || 0),
    protein: a.protein + (+i.protein_g || 0),
    fat: a.fat + (+i.fat_g || 0),
    carbs: a.carbs + (+i.carbs_g || 0)
  }), {kcal: 0, protein: 0, fat: 0, carbs: 0})

  const preview = selectedFood
    ? (() => {
        const k = amount / 100

        return {
          kcal: Math.round((selectedFood.kcal_per100 || 0) * k),
          protein: +((selectedFood.protein_per100 || 0) * k).toFixed(1),
          fat: +((selectedFood.fat_per100 || 0) * k).toFixed(1),
          carbs: +((selectedFood.carbs_per100 || 0) * k).toFixed(1)
        }
      })()
    : null

  const cellStyle = (align = 'right') => ({
    padding: '7px 8px',
    fontSize: 12,
    textAlign: align,
    color: 'var(--text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  })

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