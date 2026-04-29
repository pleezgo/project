const pool = require('../config/db')
const { detectSleepType, calcLogDate } = require('../utils/sleepCalculations')

/**
 * Повертає всі записи сну за вказану дату.
 */
const getSleep = async (req, res) => {
  const { date } = req.params

  try {
    const result = await pool.query(
      `SELECT id, sleep_type, sleep_start, sleep_end, duration_min, quality, notes
       FROM sleep_logs
       WHERE user_id = $1 AND log_date = $2
       ORDER BY sleep_start ASC`,
      [req.user.id, date]
    )

    const nightLogs = result.rows.filter(r => r.sleep_type === 'night')
    const napLogs = result.rows.filter(r => r.sleep_type === 'nap')

    const total_min = result.rows.reduce((s, r) => s + (+r.duration_min || 0), 0)
    const night_min = nightLogs.reduce((s, r) => s + (+r.duration_min || 0), 0)
    const nap_min = napLogs.reduce((s, r) => s + (+r.duration_min || 0), 0)

    res.json({
      logs: result.rows,
      night_logs: nightLogs,
      nap_logs: napLogs,
      total_min,
      night_min,
      nap_min,
      count: result.rows.length,
    })
  } catch (err) {
    console.error('getSleep error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Додає новий запис сну. Тип визначається автоматично.
 */
const addSleep = async (req, res) => {
  const { sleep_start, sleep_end, quality, notes } = req.body

  if (!sleep_start || !sleep_end) {
    return res.status(400).json({ error: 'Час засинання і пробудження обовʼязкові' })
  }

  const startDate = new Date(sleep_start)
  const endDate = new Date(sleep_end)

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (endDate > today) {
    return res.status(400).json({ error: 'Не можна записати сон з пробудженням у майбутньому' })
  }
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({ error: 'Невірний формат дати' })
  }

  if (endDate <= startDate) {
    return res.status(400).json({ error: 'Час пробудження має бути після часу засинання' })
  }

  const durationMin = Math.round((endDate - startDate) / 60000)

  if (durationMin < 5) {
    return res.status(400).json({ error: 'Сон занадто короткий (мінімум 5 хв)' })
  }
  if (durationMin > 1440) {
    return res.status(400).json({ error: 'Сон більше 24 годин — перевірте дати' })
  }

  if (quality !== undefined && quality !== null) {
    const q = +quality
    if (q < 1 || q > 5 || !Number.isInteger(q)) {
      return res.status(400).json({ error: 'Оцінка має бути від 1 до 5' })
    }
  }

  const sleepType = detectSleepType(startDate, durationMin)
  const logDate = calcLogDate(endDate)

  try {
    // Перевірка: якщо нічний — переконатись що ще немає нічного запису на цю дату
    if (sleepType === 'night') {
      const existing = await pool.query(
        `SELECT id FROM sleep_logs
         WHERE user_id = $1 AND log_date = $2 AND sleep_type = 'night'`,
        [req.user.id, logDate]
      )
      if (existing.rows.length > 0) {
        return res.status(409).json({
          error: 'На цю дату вже є запис нічного сну. Видаліть існуючий або відредагуйте.'
        })
      }
    }

    const result = await pool.query(
      `INSERT INTO sleep_logs
        (user_id, log_date, sleep_type, sleep_start, sleep_end, duration_min, quality, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id, logDate, sleepType,
        startDate.toISOString(), endDate.toISOString(),
        durationMin, quality || null, notes || null
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('addSleep error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Оновлює існуючий запис сну (наприклад додає quality).
 */
const updateSleep = async (req, res) => {
  const { id } = req.params
  const { sleep_start, sleep_end, quality, notes } = req.body

  try {
    const existing = await pool.query(
      `SELECT * FROM sleep_logs WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Запис не знайдено' })
    }

    const current = existing.rows[0]
    const startDate = sleep_start ? new Date(sleep_start) : new Date(current.sleep_start)
    const endDate = sleep_end ? new Date(sleep_end) : new Date(current.sleep_end)

    const today = new Date()
    today.setHours(23, 59, 59, 999)
    if (endDate > today) {
      return res.status(400).json({ error: 'Не можна записати сон з пробудженням у майбутньому' })
    }

    if (endDate <= startDate) {
      return res.status(400).json({ error: 'Час пробудження має бути після часу засинання' })
    }

    const durationMin = Math.round((endDate - startDate) / 60000)
    if (durationMin < 5 || durationMin > 1440) {
      return res.status(400).json({ error: 'Невірна тривалість сну' })
    }

    const sleepType = detectSleepType(startDate, durationMin)
    const logDate = calcLogDate(endDate)

    const result = await pool.query(
      `UPDATE sleep_logs SET
        sleep_start = $1, sleep_end = $2, duration_min = $3,
        sleep_type = $4, log_date = $5,
        quality = $6, notes = $7
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [
        startDate.toISOString(), endDate.toISOString(), durationMin,
        sleepType, logDate,
        quality !== undefined ? quality : current.quality,
        notes !== undefined ? notes : current.notes,
        id, req.user.id
      ]
    )
    res.json(result.rows[0])
  } catch (err) {
    console.error('updateSleep error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Видаляє запис сну.
 */
const deleteSleep = async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      `DELETE FROM sleep_logs WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Запис не знайдено' })
    }
    res.json({ success: true })
  } catch (err) {
    console.error('deleteSleep error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Повертає агреговані дані по днях для календаря місяця.
 */
const getSleepCalendar = async (req, res) => {
  const { month } = req.query

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Параметр month у форматі YYYY-MM обовʼязковий' })
  }

  try {
    const result = await pool.query(
        `SELECT 
            TO_CHAR(log_date, 'YYYY-MM-DD') AS log_date,
            SUM(duration_min) FILTER (WHERE sleep_type = 'night') AS night_min,
            SUM(duration_min) FILTER (WHERE sleep_type = 'nap') AS nap_min,
            SUM(duration_min) AS total_min,
            AVG(quality) FILTER (WHERE quality IS NOT NULL) AS quality_avg
        FROM sleep_logs
        WHERE user_id = $1 
            AND log_date >= ($2 || '-01')::date
            AND log_date < (($2 || '-01')::date + INTERVAL '1 month')
        GROUP BY log_date
        ORDER BY log_date`,
        [req.user.id, month]
    )
    

    res.json({ days: result.rows })
  } catch (err) {
    console.error('getSleepCalendar error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = { getSleep, addSleep, updateSleep, deleteSleep, getSleepCalendar }