import { useState } from 'react'
import { api } from '../api/api'
import { formatDuration } from '../utils/sleepUtils'
import StarRating from './StarRating'

/**
 * Модал додавання або редагування запису сну.
 * @param {object} props
 * @param {string} props.date Поточна вибрана дата (YYYY-MM-DD)
 * @param {object} [props.editLog] Якщо передано — редагуємо існуючий запис
 * @param {function} props.onClose
 * @param {function} props.onSaved
 */
export default function SleepModal({ date, editLog, onClose, onSaved }) {
  // Дефолтні значення для нового запису:
  // засинання — попередній день о 23:00, пробудження — поточний день о 07:00
  const getDefaults = () => {
    if (editLog) {
      const start = new Date(editLog.sleep_start)
      const end = new Date(editLog.sleep_end)
      return {
        startDate: toDateInput(start),
        startTime: toTimeInput(start),
        endDate: toDateInput(end),
        endTime: toTimeInput(end),
        quality: editLog.quality || 0,
      }
    }

    const targetDate = new Date(date + 'T00:00:00')
    const yesterday = new Date(targetDate)
    yesterday.setDate(yesterday.getDate() - 1)

    return {
      startDate: toDateInput(yesterday),
      startTime: '23:00',
      endDate: toDateInput(targetDate),
      endTime: '07:00',
      quality: 0,
    }
  }

  const [form, setForm] = useState(getDefaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Розрахунок тривалості для попереднього перегляду
  const startISO = `${form.startDate}T${form.startTime}:00`
  const endISO = `${form.endDate}T${form.endTime}:00`
  const startMs = new Date(startISO).getTime()
  const endMs = new Date(endISO).getTime()
  const previewMin = (endMs > startMs && !isNaN(startMs) && !isNaN(endMs))
    ? Math.round((endMs - startMs) / 60000)
    : 0

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const save = async () => {
    setError('')

    if (endMs <= startMs) {
      setError('Час пробудження має бути після часу засинання')
      return
    }
    if (previewMin < 5) {
      setError('Сон занадто короткий')
      return
    }
    if (previewMin > 1440) {
      setError('Сон більше 24 годин — перевірте дати')
      return
    }

    setLoading(true)
    try {
      const body = {
        sleep_start: new Date(startISO).toISOString(),
        sleep_end: new Date(endISO).toISOString(),
        quality: form.quality || null,
      }

      if (editLog) {
        await api.updateSleep(editLog.id, body)
      } else {
        await api.addSleep(body)
      }
      onSaved()
    } catch (e) {
      setError(e.message || 'Помилка збереження')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
    >
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>
            {editLog ? 'Редагувати запис сну' : 'Записати сон'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, color: 'var(--text-muted)', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {error && (
            <div style={{ border: '1px solid var(--red)', padding: '8px 10px', fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Час засинання</label>
            <div className="form-row">
              <input type="date" className="form-input" value={form.startDate} onChange={e => update('startDate', e.target.value)} />
              <input type="time" className="form-input" value={form.startTime} onChange={e => update('startTime', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Час пробудження</label>
            <div className="form-row">
              <input type="date" className="form-input" value={form.endDate} onChange={e => update('endDate', e.target.value)} />
              <input type="time" className="form-input" value={form.endTime} onChange={e => update('endTime', e.target.value)} />
            </div>
          </div>

          {previewMin > 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, padding: '8px 10px', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              Тривалість: <strong style={{ color: 'var(--text)' }}>{formatDuration(previewMin)}</strong>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Як спалося? <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(опційно)</span></label>
            <StarRating value={form.quality} onChange={v => update('quality', v)} size={24} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={onClose} className="btn">Скасувати</button>
            <button onClick={save} disabled={loading} className="btn btn-primary">
              {loading ? 'Збереження...' : 'Зберегти'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Допоміжні функції форматування
/**
 *
 * @param d
 */
function toDateInput(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 *
 * @param d
 */
function toTimeInput(d) {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}