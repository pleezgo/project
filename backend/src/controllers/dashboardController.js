const pool = require('../config/db')

/**
 * Повертає зведення за один день: профіль + харчування + активність + гідрація + сон.
 */
const getDashboard = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0]
  try {
    const [profile, food, activity, hydration, sleep] = await Promise.all([
      pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [req.user.id]
      ),
      pool.query(
        `SELECT
          COALESCE(SUM(kcal), 0) AS kcal,
          COALESCE(SUM(protein_g), 0) AS protein,
          COALESCE(SUM(fat_g), 0) AS fat,
          COALESCE(SUM(carbs_g), 0) AS carbs
         FROM food_logs
         WHERE user_id = $1 AND log_date = $2`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT
          COALESCE(SUM(kcal_burned), 0) AS kcal_burned,
          COALESCE(SUM(duration_min), 0) AS duration_min,
          COUNT(*) AS count
         FROM activity_logs
         WHERE user_id = $1 AND log_date = $2`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT
          COALESCE(SUM(amount_ml), 0) AS total_ml,
          COUNT(*) AS count
         FROM hydration_logs
         WHERE user_id = $1 AND log_date = $2`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT
          COALESCE(SUM(duration_min) FILTER (WHERE sleep_type = 'night'), 0) AS night_min,
          COALESCE(SUM(duration_min) FILTER (WHERE sleep_type = 'nap'), 0) AS nap_min,
          AVG(quality) FILTER (WHERE sleep_type = 'night' AND quality IS NOT NULL) AS night_quality_avg,
          COUNT(*) AS count
         FROM sleep_logs
         WHERE user_id = $1 AND log_date = $2`,
        [req.user.id, date]
      )
    ])

    res.json({
      profile: profile.rows[0] || {},
      food: food.rows[0],
      activity: activity.rows[0],
      hydration: hydration.rows[0],
      sleep: sleep.rows[0],
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Повертає агреговані дані по днях за вказаний місяць — для календаря-приладки.
 * Один SQL з LEFT JOIN-агрегатами по 4 модулях, прив'язано до серії дат місяця.
 */
const getDashboardMonth = async (req, res) => {
  const { month } = req.query

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Параметр month у форматі YYYY-MM обовʼязковий' })
  }

  try {
    const result = await pool.query(
      `WITH days AS (
         SELECT generate_series(
           ($1 || '-01')::date,
           (($1 || '-01')::date + INTERVAL '1 month - 1 day')::date,
           INTERVAL '1 day'
         )::date AS log_date
       ),
       food AS (
         SELECT log_date, SUM(kcal) AS kcal
         FROM food_logs
         WHERE user_id = $2
           AND log_date >= ($1 || '-01')::date
           AND log_date < (($1 || '-01')::date + INTERVAL '1 month')
         GROUP BY log_date
       ),
       act AS (
         SELECT log_date, SUM(kcal_burned) AS kcal_burned
         FROM activity_logs
         WHERE user_id = $2
           AND log_date >= ($1 || '-01')::date
           AND log_date < (($1 || '-01')::date + INTERVAL '1 month')
         GROUP BY log_date
       ),
       water AS (
         SELECT log_date, SUM(amount_ml) AS water_ml
         FROM hydration_logs
         WHERE user_id = $2
           AND log_date >= ($1 || '-01')::date
           AND log_date < (($1 || '-01')::date + INTERVAL '1 month')
         GROUP BY log_date
       ),
       sleep AS (
         SELECT
           log_date,
           SUM(duration_min) FILTER (WHERE sleep_type = 'night') AS night_min,
           AVG(quality) FILTER (WHERE sleep_type = 'night' AND quality IS NOT NULL) AS quality_avg
         FROM sleep_logs
         WHERE user_id = $2
           AND log_date >= ($1 || '-01')::date
           AND log_date < (($1 || '-01')::date + INTERVAL '1 month')
         GROUP BY log_date
       )
       SELECT
         TO_CHAR(d.log_date, 'YYYY-MM-DD') AS log_date,
         COALESCE(food.kcal, 0)            AS kcal,
         COALESCE(act.kcal_burned, 0)      AS kcal_burned,
         COALESCE(water.water_ml, 0)       AS water_ml,
         COALESCE(sleep.night_min, 0)      AS night_min,
         sleep.quality_avg                 AS quality_avg
       FROM days d
       LEFT JOIN food  ON food.log_date  = d.log_date
       LEFT JOIN act   ON act.log_date   = d.log_date
       LEFT JOIN water ON water.log_date = d.log_date
       LEFT JOIN sleep ON sleep.log_date = d.log_date
       ORDER BY d.log_date`,
      [month, req.user.id]
    )

    res.json({ days: result.rows })
  } catch (err) {
    console.error('getDashboardMonth error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Повертає середні значення за останні 7 днів від вказаної дати (включно).
 * Використовується для тижневої смуги на дашборді.
 */
const getWeekSummary = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0]

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Параметр date у форматі YYYY-MM-DD обовʼязковий' })
  }

  try {
    const [food, activity, hydration, sleep] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(kcal), 0) AS total_kcal
         FROM food_logs
         WHERE user_id = $1 AND log_date > $2::date - INTERVAL '7 days' AND log_date <= $2::date`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT COALESCE(SUM(kcal_burned), 0) AS total_burned
         FROM activity_logs
         WHERE user_id = $1 AND log_date > $2::date - INTERVAL '7 days' AND log_date <= $2::date`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount_ml), 0) AS total_ml
         FROM hydration_logs
         WHERE user_id = $1 AND log_date > $2::date - INTERVAL '7 days' AND log_date <= $2::date`,
        [req.user.id, date]
      ),
      pool.query(
        `SELECT COALESCE(SUM(duration_min) FILTER (WHERE sleep_type = 'night'), 0) AS total_night_min
         FROM sleep_logs
         WHERE user_id = $1 AND log_date > $2::date - INTERVAL '7 days' AND log_date <= $2::date`,
        [req.user.id, date]
      ),
    ])

    res.json({
      avg_kcal:        Math.round(+food.rows[0].total_kcal / 7),
      avg_kcal_burned: Math.round(+activity.rows[0].total_burned / 7),
      avg_water_ml:    Math.round(+hydration.rows[0].total_ml / 7),
      avg_sleep_min:   Math.round(+sleep.rows[0].total_night_min / 7),
    })
  } catch (err) {
    console.error('getWeekSummary error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = { getDashboard, getDashboardMonth, getWeekSummary }