const pool = require('../config/db')

const getDashboard = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0]
  try {
    const [profile, food, activity] = await Promise.all([
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
      )
    ])

    res.json({
      profile: profile.rows[0] || {},
      food: food.rows[0],
      activity: activity.rows[0]
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = { getDashboard }