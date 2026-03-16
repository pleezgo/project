const pool = require('../config/db')

const calcBMR = (weight, height, age, sex) => {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(sex === 'female' ? base - 161 : base + 5)
}

const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const calcTDEE = (bmr, activity) => {
  return Math.round(bmr * (activityFactors[activity] || 1.375))
}

const calcCalorieGoal = (tdee, goal) => {
  if(goal == 'lose') return tdee - 500
  if(goal == 'gain') return tdee + 300
  return tdee
}

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT up.*, u.email, u.name
       FROM user_profiles up
       JOIN users u ON u.id = up.user_id
       WHERE up.user_id = $1`,
      [req.user.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error:'Профіль не знайдено'})
    }
    res.json(result.rows[0])
  } catch (err) {
    console.error('Get profile error:', err)
    res.status(500).json({error: 'Помилка сервера'})
  }
}

const updateProfile = async (req, res) => {
  const { age, sex, weight, height, activity, goal, water_goal, name } = req.body

  try {
    let bmr = null, tdee = null, calorie_goal = null
    if (weight && height && age && sex) {
      bmr = calcBMR(weight, height, age, sex)
      tdee = calcTDEE(bmr, activity)
      calorie_goal = calcCalorieGoal(tdee, goal)
    }

    await pool.query(
      `UPDATE user_profiles SET
        age = $1, sex = $2, weight = $3, height = $4,
        activity = $5, goal = $6, water_goal = $7,
        bmr = $8, tdee = $9, calorie_goal = $10,
        updated_at = NOW()
       WHERE user_id = $11`,
      [age, sex, weight, height, activity, goal,
       water_goal || 2000, bmr, tdee, calorie_goal, req.user.id]
    )

    if (name) {
      await pool.query(
        'UPDATE users SET name = $1 WHERE id = $2',
        [name, req.user.id]
      )
    }

    const result = await pool.query(
      `SELECT up.*, u.email, u.name
       FROM user_profiles up
       JOIN users u ON u.id = up.user_id
       WHERE up.user_id = $1`,
      [req.user.id]
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = { getProfile, updateProfile }