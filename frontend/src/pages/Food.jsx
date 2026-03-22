import { useState, useEffect, useRef } from 'react'
import { api } from '../api/api'

const today = () => new Date().toISOString().split('T')[0]

const addDays = (dateStr, n) => {
  const parts = dateStr.split('-')
  const d = new Date(+parts[0], +parts[1] - 1, +parts[2])
  d.setDate(d.getDate() + n)

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')

  return `${y}-${m}-${day}`
}

const displayDate = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('uk-UA', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })

const MEALS = [
  { id: 'breakfast', label: 'Сніданок' },
  { id: 'lunch', label: 'Обід' },
  { id: 'dinner', label: 'Вечеря' },
  { id: 'snack', label: 'Перекус' }
]

const COLS = '1fr 44px 44px 44px 44px 60px 24px'

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

  const deleteLog = async (id) => {
    await api.deleteFoodLog(id)
    load(date)
  }

  const openModal = (meal) => {
    setCurrentMeal(meal)
    setShowModal(true)
    setTab('search')
    setSelectedFood(null)
    setSearchQ('')
    setSearchResults([])
    setAmount(100)
  }

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

  const calorieGoal = profile.calorie_goal || 2000
  const proteinGoal = profile.calorie_goal ? Math.round(profile.calorie_goal * 0.25 / 4) : 125
  const fatGoal = profile.calorie_goal ? Math.round(profile.calorie_goal * 0.30 / 9) : 67
  const carbsGoal = profile.calorie_goal ? Math.round(profile.calorie_goal * 0.45 / 4) : 250

  const total = logs.reduce((a, i) => ({
    kcal: a.kcal + (+i.kcal || 0),
    protein: a.protein + (+i.protein_g || 0),
    fat: a.fat + (+i.fat_g || 0),
    carbs: a.carbs + (+i.carbs_g || 0)
  }), {kcal: 0, protein: 0, fat: 0, carbs: 0})

  const pct = (v, m) => Math.min(100, Math.round(v / (m || 1) * 100))

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

        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setDate(d => addDays(d, -1))}
            style={{
              padding: '5px 12px',
              border: 'none',
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 16
            }}
          >
            ‹
          </button>

          <span style={{ padding: '5px 14px', fontSize: 13 }}>{displayDate(date)}</span>

          <button
            onClick={() => setDate(d => addDays(d, 1))}
            disabled={date >= today()}
            style={{
              padding: '5px 12px',
              border: 'none',
              borderLeft: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 16,
              opacity: date >= today() ? 0.3 : 1
            }}
          >
            ›
          </button>
        </div>
      </div>

      <div className="stats-row" style={{ marginBottom: 12 }}>
        {[
          ['Калорії', Math.round(total.kcal), calorieGoal, 'ккал', 'var(--accent)'],
          ['Білки', Math.round(total.protein), proteinGoal, 'г', 'var(--green)'],
          ['Жири', Math.round(total.fat), fatGoal, 'г', 'var(--amber)'],
          ['Вуглеводи', Math.round(total.carbs), carbsGoal, 'г', 'var(--purple)']
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
        <div style={{ border: '1px solid var(--border)', minWidth: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: COLS, background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
            {['Продукт', 'г', 'Б', 'Ж', 'В', 'Ккал', ''].map((h, i) => (
              <div
                key={i}
                style={{
                  padding: '6px 8px',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                  textAlign: i == 0 ? 'left' : 'right',
                  paddingLeft: i == 0 ? 12 : 8
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {MEALS.map(meal => {
            const items = logs.filter(l => l.meal_type === meal.id)
            const mTotal = Math.round(items.reduce((s, i) => s + (+i.kcal || 0), 0))

            return (
              <div key={meal.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    borderBottom: items.length ? '1px solid var(--border-light)' : 'none'
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{meal.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 10 }}>{mTotal} ккал</span>
                  <button
                    onClick={() => openModal(meal.id)}
                    style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    + додати
                  </button>
                </div>

                {items.length === 0 && (
                  <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-faint)' }}>Немає записів</div>
                )}

                {items.map(item => (
                  <div key={item.id} style={{ display: 'grid', gridTemplateColumns: COLS, borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ ...cellStyle('left'), paddingLeft: 12, color: 'var(--text)' }}>{item.food_name}</div>
                    <div style={cellStyle()}>{Math.round(item.amount_g)}</div>
                    <div style={cellStyle()}>{Math.round(item.protein_g)}</div>
                    <div style={cellStyle()}>{Math.round(item.fat_g)}</div>
                    <div style={cellStyle()}>{Math.round(item.carbs_g)}</div>
                    <div style={{ ...cellStyle(), color: 'var(--accent)', fontWeight: 500 }}>{Math.round(item.kcal)}</div>
                    <div
                      onClick={() => deleteLog(item.id)}
                      style={{ ...cellStyle('center'), color: 'var(--text-faint)', cursor: 'pointer' }}
                    >
                      х
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-title">Баланс КБЖВ</div>

            {[
              ['Вуглеводи', Math.round(total.carbs), carbsGoal, 'var(--purple)'],
              ['Білки', Math.round(total.protein), proteinGoal, 'var(--green)'],
              ['Жири', Math.round(total.fat), fatGoal, 'var(--amber)']
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
              ['Ціль', `${calorieGoal} ккал`],
              ['Залишок', `${Math.max(0, calorieGoal - Math.round(total.kcal))} ккал`],
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
        <div
          onClick={e => e.target === e.currentTarget && closeModal()}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: 460,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)'
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 500 }}>
                Додати — {MEALS.find(m => m.id === currentMeal)?.label}
              </div>

              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', border: '1px solid var(--border)', marginBottom: 16 }}>
                {['search', 'custom'].map((t, i) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      flex: 1,
                      padding: '7px',
                      border: 'none',
                      borderRight: i === 0 ? '1px solid var(--border)' : 'none',
                      background: tab === t ? 'var(--bg-secondary)' : 'var(--bg)',
                      color: tab === t ? 'var(--text)' : 'var(--text-muted)',
                      fontSize: 13,
                      cursor: 'pointer'
                    }}
                  >
                    {t === 'search' ? 'Пошук USDA' : 'Свій продукт'}
                  </button>
                ))}
              </div>

              {tab === 'search' && (
                <div>
                  <input
                    value={searchQ}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Назва продукту англійською..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      fontSize: 13,
                      marginBottom: 8,
                      outline: 'none'
                    }}
                    autoFocus
                  />

                  {searchResults.length > 0 && !selectedFood && (
                    <div style={{ border: '1px solid var(--border)', maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                      {searchResults.map((f, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setSelectedFood(f)
                            setSearchResults([])
                          }}
                          style={{
                            padding: '8px 12px',
                            fontSize: 13,
                            borderBottom: '1px solid var(--border-light)',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}
                        >
                          <div>{f.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {Math.round(f.kcal_per100)} ккал · Б:{Math.round(f.protein_per100)}г Ж:{Math.round(f.fat_per100)}г В:{Math.round(f.carbs_per100)}г (100г)
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedFood && (
                    <div>
                      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '10px 12px', marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{selectedFood.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {Math.round(selectedFood.kcal_per100)} ккал/100г · Б:{Math.round(selectedFood.protein_per100)}г Ж:{Math.round(selectedFood.fat_per100)}г В:{Math.round(selectedFood.carbs_per100)}г
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Кількість (г)</label>
                        <input
                          type="number"
                          className="form-input"
                          value={amount}
                          onChange={e => {
                            const val = e.target.value
                            setAmount(val === '' ? '' : +val)
                          }}
                          min="1"
                          max="2000"
                        />
                      </div>

                      {preview && (
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--text-muted)',
                            marginBottom: 12,
                            padding: '8px 10px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)'
                          }}
                        >
                          ≈ {preview.kcal} ккал · Б:{preview.protein}г Ж:{preview.fat}г В:{preview.carbs}г
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button onClick={() => setSelectedFood(null)} className="btn">
                          ← Назад
                        </button>
                        <button onClick={addSelected} className="btn btn-primary" disabled={!amount || +amount < 1}>
                          Додати
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'custom' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Назва</label>
                    <input
                      className="form-input"
                      value={customForm.name}
                      onChange={e => setCustomForm(f => ({...f, name: e.target.value}))}
                      placeholder="Наприклад: Домашній борщ"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Ккал на 100г</label>
                      <input
                        type="number"
                        className="form-input"
                        value={customForm.kcal_per100}
                        onChange={e => setCustomForm(f => ({ ...f, kcal_per100: e.target.value }))}
                        placeholder="200"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Кількість (г)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={customForm.amount}
                        onChange={e => {
                          const val = e.target.value
                          setCustomForm(f => ({...f, amount: val === '' ? '' : +val}))
                        }}
                        placeholder="200"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Білки/100г</label>
                      <input
                        type="number"
                        className="form-input"
                        value={customForm.protein_per100}
                        onChange={e => setCustomForm(f => ({ ...f, protein_per100: e.target.value }))}
                        placeholder="10"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Жири/100г</label>
                      <input
                        type="number"
                        className="form-input"
                        value={customForm.fat_per100}
                        onChange={e => setCustomForm(f => ({...f, fat_per100: e.target.value}))}
                        placeholder="5"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Вуглеводи/100г</label>
                    <input
                      type="number"
                      className="form-input"
                      value={customForm.carbs_per100}
                      onChange={e => setCustomForm(f => ({ ...f, carbs_per100: e.target.value }))}
                      placeholder="30"
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={closeModal} className="btn">Скасувати</button>
                    <button onClick={addCustom} className="btn btn-primary" disabled={!customForm.amount || +customForm.amount < 1}>Додати</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}