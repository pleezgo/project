import { useState, useEffect } from 'react'
import { api } from '../api/api'

/**
* Доступні рівні фізичної активності для налаштування профілю користувача.
*/
const ACTIVITIES = [
  { value: 'sedentary', label: 'Сидячий спосіб життя' },
  { value: 'light', label: 'Легка активність (1–3 рази/тиж)' },
  { value: 'moderate', label: 'Помірна (3–5 разів/тиж)' },
  { value: 'active', label: 'Активний (6–7 разів/тиж)' },
  { value: 'very_active', label: 'Дуже активний' }
]

/**
 * Доступні цілі користувача для розрахунку добової калорійності.
 */
const GOALS = [
  { value: 'lose', label: 'Схуднення (-500 ккал)' },
  { value: 'maintain', label: 'Підтримка' },
  { value: 'gain', label: 'Набір маси (+300 ккал)' }
]

/**
 * Сторінка профілю користувача.
 *
 * Завантажує поточний профіль, дозволяє редагувати персональні дані,
 * параметри активності й цілі, а також відображає розраховані показники
 * BMR, TDEE, калорійну ціль та індекс маси тіла.
 *
 * @returns {Object}
 */
export default function Profile() {
  const [form, setForm] = useState({
    name: '',
    age: '',
    sex: 'male',
    weight: '',
    height: '',
    activity: 'moderate',
    goal: 'maintain',
    water_goal: 2000
  })
  const [profile, setProfile] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getProfile()
      .then(p => {
        setProfile(p)
        setForm({
          name: p.name || '',
          age: p.age || '',
          sex: p.sex || 'male',
          weight: p.weight || '',
          height: p.height || '',
          activity: p.activity || 'moderate',
          goal: p.goal || 'maintain',
          water_goal: p.water_goal || 2000,
        })
      })
      .catch(err => console.error(err))
  }, [])

  /**
   * Зберігає оновлені дані профілю користувача через API.
   *
   * Перевіряє наявність обов'язкових полів для розрахунку норм,
   * перетворює числові значення форми та після успішного збереження
   * оновлює локальний стан профілю.
   *
   * @returns {Promise<void>}
   */
  const save = async () => {
    setError('')

    if (!form.age || !form.weight || !form.height) {
      setError('Заповніть вік, вагу та зріст для розрахунку норм')
      return
    }

    try {
      const p = await api.updateProfile({
        ...form,
        age: +form.age,
        weight: +form.weight,
        height: +form.height,
        water_goal: +form.water_goal
      })

      setProfile(p)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch(err) {
      setError(err.message)
    }
  }

  const bmi = form.weight && form.height
    ? +(+form.weight / ((+form.height / 100) ** 2)).toFixed(1)
    : null

  const bmiLabel = !bmi ? '—'
    : bmi < 18.5 ? 'Недовага'
    : bmi < 25 ? 'Норма'
    : bmi < 30 ? 'Надлишок ваги'
    : 'Ожиріння'

  const bmiColor = !bmi ? 'var(--text-faint)'
    : bmi < 18.5 ? 'var(--accent)'
    : bmi < 25 ? 'var(--green)'
    : bmi < 30 ? 'var(--amber)'
    : 'var(--red)'
    
  /**
   * Повертає набір властивостей для прив'язки поля форми до стану компонента.
   *
   * @param {string} key Ключ поля у стані form.
   * @returns {Object}
   */
  const f = (key) => ({
    value: form[key],
    onChange: e => setForm(prev => ({ ...prev, [key]: e.target.value }))
  })

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 16 }}>Профіль</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-title">Особисті дані</div>

          {error && (
            <div style={{ border: '1px solid var(--red)', padding: '8px 10px', fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Імʼя</label>
            <input className="form-input" {...f('name')} placeholder="Іван Петренко" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Вік</label>
              <input type="number" className="form-input" {...f('age')} placeholder="25" min="10" max="120" />
            </div>

            <div className="form-group">
              <label className="form-label">Стать</label>
              <select className="form-select" {...f('sex')}>
                <option value="male">Чоловіча</option>
                <option value="female">Жіноча</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Вага (кг)</label>
              <input type="number" className="form-input" {...f('weight')} placeholder="70" step="0.5" />
            </div>

            <div className="form-group">
              <label className="form-label">Зріст (см)</label>
              <input type="number" className="form-input" {...f('height')} placeholder="175" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Рівень активності</label>
            <select className="form-select" {...f('activity')}>
              {ACTIVITIES.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ціль</label>
            <select className="form-select" {...f('goal')}>
              {GOALS.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Норма води (мл/день)</label>
            <input type="number" className="form-input" {...f('water_goal')} placeholder="2000" step="100" />
          </div>

          <button className="btn btn-primary w-full" onClick={save}>
            {saved ? 'Збережено' : 'Зберегти'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-title">ІМТ</div>

            {bmi ? (
              <>
                <div style={{ fontSize: 32, fontWeight: 500, color: bmiColor, marginBottom: 4 }}>{bmi}</div>
                <div style={{ fontSize: 13, color: bmiColor, marginBottom: 12 }}>{bmiLabel}</div>

                <div style={{ height: 4, background: 'var(--border-light)', position: 'relative', marginBottom: 6 }}>
                  <div
                    style={{
                      position: 'absolute',
                      top: -3,
                      width: 10,
                      height: 10,
                      background: bmiColor,
                      border: '2px solid var(--bg)',
                      left: Math.max(0, Math.min(100, (bmi - 10) / 30 * 100)) + '%',
                      transform: 'translateX(-50%)'
                    }}
                  />
                  <div style={{ height: '100%', background: 'linear-gradient(90deg, var(--accent) 0%, var(--green) 30%, var(--amber) 65%, var(--red) 100%)' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-faint)' }}>
                  <span>&lt;18.5</span>
                  <span>18.5–25</span>
                  <span>25–30</span>
                  <span>&gt;30</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-faint)' }}>Заповніть вагу та зріст</div>
            )}
          </div>

          {profile?.tdee && (
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-title">Розраховані норми</div>

              {[
                ['BMR (базовий обмін)', `${profile.bmr} ккал`],
                ['TDEE (денна норма)', `${profile.tdee} ккал`],
                ['Ціль калорій', `${profile.calorie_goal} ккал/день`],
                ['Білки', `${Math.round(profile.calorie_goal * 0.25 / 4)} г`],
                ['Жири', `${Math.round(profile.calorie_goal * 0.30 / 9)} г`],
                ['Вуглеводи', `${Math.round(profile.calorie_goal * 0.45 / 4)} г`]
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
          )}
        </div>
      </div>
    </div>
  )
}