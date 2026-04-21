const pool = require('../config/db')
const { calcBMR, calcTDEE, calcCalorieGoal, calcExerciseKcal } = require('../utils/calculations')

const getExercises = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM exercises ORDER BY name ASC')
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

const getActivityLogs = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0]
  try {
    const result = await pool.query(
      `SELECT * FROM activity_logs
       WHERE user_id = $1 AND log_date = $2
       ORDER BY created_at ASC`,
      [req.user.id, date]
    )
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

const addActivityLog = async (req, res) => {
  const {
    log_date, exercise_id,
    duration_min, distance_km,
    sets, reps, weight_used_kg,
    intensity
  } = req.body

  if (!exercise_id) {
    return res.status(400).json({ error: 'Вправа обовʼязкова' })
  }

  try {
    // Отримуємо дані вправи і вагу користувача з БД
    const [exerciseRes, profileRes] = await Promise.all([
      pool.query('SELECT * FROM exercises WHERE id = $1', [exercise_id]),
      pool.query('SELECT weight FROM user_profiles WHERE user_id = $1', [req.user.id])
    ])

    const exercise = exerciseRes.rows[0]
    if (!exercise) {
      return res.status(404).json({ error: 'Вправу не знайдено' })
    }

    const userWeight = profileRes.rows[0]?.weight

    // Валідація параметрів залежно від категорії
    const needsDuration = ['cardio_time', 'isometric'].includes(exercise.category)
    const needsRepsOrDuration = exercise.category === 'cardio_distance'
    const needsSetsReps = ['bodyweight_reps', 'weighted_reps'].includes(exercise.category)

    if (needsDuration && !duration_min) {
      return res.status(400).json({ error: 'Тривалість обовʼязкова' })
    }
    if (needsRepsOrDuration && !duration_min && !distance_km) {
      return res.status(400).json({ error: 'Введіть час або дистанцію' })
    }
    if (needsSetsReps && (!sets || !reps)) {
      return res.status(400).json({ error: 'Введіть підходи і повторення' })
    }

    // Розрахунок калорій
    const kcal = calcExerciseKcal(exercise, {
      duration_min, distance_km, sets, reps, weight_used_kg, intensity
    }, userWeight)

    const result = await pool.query(
      `INSERT INTO activity_logs
        (user_id, log_date, exercise_id, exercise_name, category,
         duration_min, distance_km, sets, reps, weight_used_kg,
         intensity, kcal_burned)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.user.id,
        log_date || new Date().toISOString().split('T')[0],
        exercise_id,
        exercise.name,
        exercise.category,
        duration_min || null,
        distance_km || null,
        sets || null,
        reps || null,
        weight_used_kg || null,
        intensity || 'moderate',
        kcal
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    console.error('addActivityLog error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

const deleteActivityLog = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM activity_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Запис не знайдено' })
    }
    res.json({ message: 'Видалено' })
  } catch{
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

const getWeightLog = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0]
  try {
    const result = await pool.query(
      'SELECT * FROM weight_logs WHERE user_id = $1 AND log_date = $2',
      [req.user.id, date]
    )
    res.json(result.rows[0] || null)
  } catch {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

const addWeightLog = async (req, res) => {
  const { log_date, weight } = req.body

  if (!weight) {
    return res.status(400).json({ error: 'Вага обовʼязкова' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO weight_logs (user_id, log_date, weight)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, log_date) DO UPDATE SET weight = $3
       RETURNING *`,
      [req.user.id, log_date || new Date().toISOString().split('T')[0], weight]
    )

    const profile = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [req.user.id]
    )

    const p = profile.rows[0]

    const isToday = (log_date || new Date().toISOString().split('T')[0]) === new Date().toISOString().split('T')[0]
    if (isToday && p && p.age && p.height && p.sex) {
      const bmr = calcBMR(weight, p.height, p.age, p.sex)
      const tdee = calcTDEE(bmr, p.activity)
      const calorie_goal = calcCalorieGoal(tdee, p.goal)

      await pool.query(
        `UPDATE user_profiles SET
          weight = $1, bmr = $2, tdee = $3, calorie_goal = $4, updated_at = NOW()
         WHERE user_id = $5`,
        [weight, bmr, tdee, calorie_goal, req.user.id]
      )
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('addWeightLog error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = {
  getExercises, getActivityLogs, addActivityLog, deleteActivityLog,
  getWeightLog, addWeightLog
}