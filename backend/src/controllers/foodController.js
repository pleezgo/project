const pool = require('../config/db')
const https = require('https')

const getFoodLogs = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0]
  try {
    const result = await pool.query(
      `SELECT * FROM food_logs
       WHERE user_id = $1 AND log_date = $2
       ORDER BY created_at ASC`,
      [req.user.id, date]
    )
    res.json(result.rows)
  } catch(err) {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

const getFoodStats = async (req, res) => {
  const days = parseInt(req.query.days) || 7
  try {
    const result = await pool.query(
      `SELECT
        log_date,
        ROUND(SUM(kcal)::numeric, 1)      AS total_kcal,
        ROUND(SUM(protein_g)::numeric, 1) AS total_protein,
        ROUND(SUM(fat_g)::numeric, 1)     AS total_fat,
        ROUND(SUM(carbs_g)::numeric, 1)   AS total_carbs
       FROM food_logs
       WHERE user_id = $1
         AND log_date >= CURRENT_DATE - INTERVAL '1 day' * $2
       GROUP BY log_date
       ORDER BY log_date ASC`,
      [req.user.id, days - 1]
    )
    res.json(result.rows)
  } catch(err) {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

const addFoodLog = async (req, res) => {
  const { log_date, meal_type, food_name, amount_g,
          kcal, protein_g, fat_g, carbs_g, usda_fdc_id } = req.body

  if(!food_name || !amount_g || !meal_type) {
    return res.status(400).json({ error: 'Назва, кількість та прийом їжі обовʼязкові' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO food_logs
        (user_id, log_date, meal_type, food_name, amount_g,
         kcal, protein_g, fat_g, carbs_g, usda_fdc_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        req.user.id,
        log_date || new Date().toISOString().split('T')[0],
        meal_type, food_name, amount_g,
        kcal || 0, protein_g || 0, fat_g || 0, carbs_g || 0,
        usda_fdc_id || null
      ]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

const deleteFoodLog = async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM food_logs WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )
    if (result.rows.length == 0) {
      return res.status(404).json({error: 'Запис не знайдено'})
    }
    res.json({ message: 'Видалено' })
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

const getCustomFoods = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM custom_foods WHERE user_id = $1 ORDER BY name ASC',
      [req.user.id]
    )
    res.json(result.rows)
  } catch(err) {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

const addCustomFood = async (req, res) => {
  const { name, kcal_per100, protein_per100, fat_per100, carbs_per100 } = req.body

  if (!name || !kcal_per100) {
    return res.status(400).json({ error: 'Назва та калорії обовʼязкові' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO custom_foods
        (user_id, name, kcal_per100, protein_per100, fat_per100, carbs_per100)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, name, kcal_per100,
       protein_per100 || 0, fat_per100 || 0, carbs_per100 || 0]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

// пошук через USDA
// nutrientId: 1008 - калорії, 1003 - білки, 1004 - жири, 1005 - вуглеводи
const searchUSDA = async (req, res) => {
  const query = req.query.q
  if(!query) return res.status(400).json({ error: 'Введіть запит' })

  const apiKey = process.env.USDA_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'USDA API ключ не налаштований' })

  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=10&api_key=${apiKey}`

  https.get(url, (apiRes) => {
    let data = ''
    apiRes.on('data', chunk => { data += chunk })
    apiRes.on('end', () => {
      try {
        const json = JSON.parse(data)
        const foods = (json.foods || []).map(f => {
          const nutrients = {}
          ;(f.foodNutrients || []).forEach(n => {
            if (n.nutrientId === 1008) nutrients.kcal = n.value
            if (n.nutrientId === 1003) nutrients.protein = n.value
            if (n.nutrientId === 1004) nutrients.fat = n.value
            if (n.nutrientId === 1005) nutrients.carbs = n.value
          })
          return {
            fdcId: f.fdcId,
            name: f.description,
            brand: f.brandOwner || null,
            kcal_per100: nutrients.kcal || 0,
            protein_per100: nutrients.protein || 0,
            fat_per100: nutrients.fat || 0,
            carbs_per100: nutrients.carbs || 0
          }
        })
        res.json(foods)
      } catch (e) {
        console.log('помилка парсингу USDA відповіді', e)
        res.status(500).json({ error: 'Помилка обробки відповіді USDA' })
      }
    })
  }).on('error', () => {
    res.status(500).json({ error: 'Помилка підключення до USDA API' })
  })
}

const getDashboard = async (req, res) => {
  const date = req.query.date || new Date().toISOString().split('T')[0]
  try {
    const [profile, food] = await Promise.all([
      pool.query(
        'SELECT * FROM user_profiles WHERE user_id = $1',
        [req.user.id]
      ),
      pool.query(
        `SELECT
          COALESCE(SUM(kcal), 0)      AS kcal,
          COALESCE(SUM(protein_g), 0) AS protein,
          COALESCE(SUM(fat_g), 0)     AS fat,
          COALESCE(SUM(carbs_g), 0)   AS carbs
         FROM food_logs
         WHERE user_id = $1 AND log_date = $2`,
        [req.user.id, date]
      )
    ])

    res.json({
      profile: profile.rows[0] || {},
      food: food.rows[0]
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = {
  getFoodLogs, getFoodStats, addFoodLog, deleteFoodLog,
  getCustomFoods, addCustomFood, searchUSDA, getDashboard,
}