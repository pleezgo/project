import { useState, useRef } from 'react'
import { api } from '../api/api'
import { calcNutrients } from '../utils/nutritionUtils'

const MEALS = [
  { id: 'breakfast', label: 'Сніданок' },
  { id: 'lunch', label: 'Обід' },
  { id: 'dinner', label: 'Вечеря' },
  { id: 'snack', label: 'Перекус' },
]

const EMPTY_CUSTOM = {
  name: '', kcal_per100: '', protein_per100: '',
  fat_per100: '', carbs_per100: '', amount: 100,
}

/**
 *
 * @param root0
 * @param root0.mealId
 * @param root0.date
 * @param root0.onClose
 * @param root0.onSaved
 */
export default function FoodModal({ mealId, date, onClose, onSaved }) {
  const [tab, setTab] = useState('search')
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedFood, setSelectedFood] = useState(null)
  const [amount, setAmount] = useState(100)
  const [customForm, setCustomForm] = useState(EMPTY_CUSTOM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchTimer = useRef(null)

  const mealLabel = MEALS.find(m => m.id === mealId)?.label

  const handleSearch = (q) => {
    setSearchQ(q)
    setError('')
    clearTimeout(searchTimer.current)
    if (!q.trim()) { setSearchResults([]); return }

    searchTimer.current = setTimeout(async () => {
      try {
        const results = await api.searchFood(q)
        setSearchResults(results.slice(0, 8))
      } catch {
        setSearchResults([])
        setError('Помилка пошуку. Перевірте підключення.')
      }
    }, 400)
  }

  const addSelected = async () => {
    if (!selectedFood || amount <= 0) return
    setLoading(true)
    setError('')
    try {
      const nutrients = calcNutrients(selectedFood, amount)
      await api.addFoodLog({
        log_date: date,
        meal_type: mealId,
        food_name: selectedFood.name,
        amount_g: amount,
        ...nutrients,
        usda_fdc_id: selectedFood.fdcId ? String(selectedFood.fdcId) : null,
      })
      onSaved()
    } catch (e) {
      setError(e.message || 'Помилка збереження')
    } finally {
      setLoading(false)
    }
  }

  const addCustom = async () => {
    const { name, kcal_per100, protein_per100, fat_per100, carbs_per100, amount: amt } = customForm
    if (!name.trim() || !kcal_per100) {
      setError('Назва та калорії обовʼязкові')
      return
    }
    setLoading(true)
    setError('')
    try {
      const food = {
        kcal_per100: +kcal_per100,
        protein_per100: +(protein_per100 || 0),
        fat_per100: +(fat_per100 || 0),
        carbs_per100: +(carbs_per100 || 0),
      }
      const nutrients = calcNutrients(food, amt || 100)
      await api.addFoodLog({
        log_date: date,
        meal_type: mealId,
        food_name: name.trim(),
        amount_g: amt || 100,
        ...nutrients,
      })
      await api.addCustomFood({ name: name.trim(), ...food })
      onSaved()
    } catch (e) {
      setError(e.message || 'Помилка збереження')
    } finally {
      setLoading(false)
    }
  }

  const preview = selectedFood ? calcNutrients(selectedFood, amount) : null

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20
      }}
    >
      <div style={{
        background: 'var(--bg)', border: '1px solid var(--border)',
        width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border)'
        }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Додати — {mealLabel}</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer' }}
          >✕</button>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', border: '1px solid var(--border)', marginBottom: 16 }}>
            {['search', 'custom'].map((t, i) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, padding: '7px', border: 'none',
                  borderRight: i === 0 ? '1px solid var(--border)' : 'none',
                  background: tab === t ? 'var(--bg-secondary)' : 'var(--bg)',
                  color: tab === t ? 'var(--text)' : 'var(--text-muted)',
                  fontSize: 13, cursor: 'pointer'
                }}
              >
                {t === 'search' ? 'Пошук USDA' : 'Свій продукт'}
              </button>
            ))}
          </div>

          {error && (
            <div style={{ border: '1px solid var(--red)', padding: '8px 10px', fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>
              {error}
            </div>
          )}

          {tab === 'search' && (
            <div>
              <input
                value={searchQ}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Назва продукту англійською..."
                autoFocus
                style={{
                  width: '100%', padding: '8px 10px',
                  border: '1px solid var(--border)', fontSize: 13,
                  marginBottom: 8, outline: 'none', boxSizing: 'border-box'
                }}
              />

              {searchResults.length > 0 && !selectedFood && (
                <div style={{ border: '1px solid var(--border)', maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                  {searchResults.map((f, i) => (
                    <div
                      key={i}
                      onClick={() => { setSelectedFood(f); setSearchResults([]) }}
                      style={{ padding: '8px 12px', fontSize: 13, borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
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
                      type="number" className="form-input"
                      value={amount} onChange={e => {
                            const val = e.target.value
                            setAmount(val === '' ? '' : +val)
                          }}

                      min="1" max="2000"
                    />
                  </div>

                  {preview && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
                      ≈ {preview.kcal} ккал · Б:{preview.protein}г Ж:{preview.fat}г В:{preview.carbs}г
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => setSelectedFood(null)} className="btn">← Назад</button>
                    <button onClick={addSelected} disabled={loading} className="btn btn-primary">
                      {loading ? 'Збереження...' : 'Додати'}
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
                  onChange={e => setCustomForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Наприклад: Домашній борщ"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ккал на 100г</label>
                  <input type="number" className="form-input"
                    value={customForm.kcal_per100}
                    onChange={e => setCustomForm(f => ({ ...f, kcal_per100: e.target.value }))}
                    placeholder="200" />
                </div>
                <div className="form-group">
                  <label className="form-label">Кількість (г)</label>
                  <input type="number" className="form-input"
                    value={customForm.amount}
                    onChange={e => {
                          const val = e.target.value
                          setCustomForm(f => ({...f, amount: val === '' ? '' : +val}))
                        }}
                    placeholder="200" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Білки / 100г</label>
                  <input type="number" className="form-input"
                    value={customForm.protein_per100}
                    onChange={e => setCustomForm(f => ({ ...f, protein_per100: e.target.value }))}
                    placeholder="10" />
                </div>
                <div className="form-group">
                  <label className="form-label">Жири / 100г</label>
                  <input type="number" className="form-input"
                    value={customForm.fat_per100}
                    onChange={e => setCustomForm(f => ({ ...f, fat_per100: e.target.value }))}
                    placeholder="5" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Вуглеводи / 100г</label>
                <input type="number" className="form-input"
                  value={customForm.carbs_per100}
                  onChange={e => setCustomForm(f => ({ ...f, carbs_per100: e.target.value }))}
                  placeholder="30" />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={onClose} className="btn">Скасувати</button>
                <button onClick={addCustom} disabled={loading} className="btn btn-primary">
                  {loading ? 'Збереження...' : 'Додати'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}