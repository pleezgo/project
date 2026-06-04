/**
 * Бізнес-логіка щоденника харчування, статистики та пошуку продуктів.
 *
 * Цей модуль відповідає за:
 * - збереження записів про спожиту їжу
 * - обчислення денних і періодичних показників харчування
 * - роботу з власними продуктами користувача
 * - пошук продуктів через зовнішній USDA FoodData Central API
 * - формування агрегованих даних для dashboard.
 *
 * Основне бізнес-правило модуля полягає в тому, що всі записи,
 * статистика та власні продукти прив’язані до конкретного
 * авторизованого користувача.
 */

const pool = require('../config/db')
const https = require('https')
const { checkRange } = require('../utils/validation')

/**
 * Повертає список записів харчування поточного користувача за обрану дату.
 *
 * Якщо дата не передана, використовує поточну дату. Результат
 * сортується за часом створення у зростаючому порядку.
 * @param {object} req HTTP-запит з необов'язковою датою в query-параметрі.
 * @param {object} res HTTP-відповідь зі списком записів харчування або повідомленням про помилку.
 * @returns {Promise<void>}
 */
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
  } catch {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Повертає агреговану статистику харчування користувача за останні N днів.
 *
 * Обчислює сумарні калорії, білки, жири та вуглеводи для кожної дати
 * у вибраному часовому проміжку. Якщо параметр days не передано,
 * використовується значення 7.
 * @param {object} req HTTP-запит з необов'язковим query-параметром days.
 * @param {object} res HTTP-відповідь зі статистикою по днях або повідомленням про помилку.
 * @returns {Promise<void>}
 */
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
  } catch {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Додає новий запис про спожиту їжу до щоденника користувача.
 *
 * Перевіряє наявність обов'язкових полів, створює запис у таблиці food_logs
 * і повертає створений об'єкт. Якщо дата не передана, використовує поточну дату.
 * @param {object} req HTTP-запит з даними запису харчування в тілі запиту.
 * @param {object} res HTTP-відповідь зі створеним записом або повідомленням про помилку.
 * @returns {Promise<void>}
 */
const addFoodLog = async (req, res) => {
  const { log_date, meal_type, food_name, amount_g,
          kcal, protein_g, fat_g, carbs_g, usda_fdc_id } = req.body

  if(!food_name || !amount_g || !meal_type) {
    return res.status(400).json({ error: 'Назва, кількість та прийом їжі обовʼязкові' })
  }
  
  try {
    checkRange(amount_g, 'Кількість', 1, 5000)
    checkRange(kcal, 'Калорії', 0, 99999)
    checkRange(protein_g, 'Білки', 0, 9999)
    checkRange(fat_g, 'Жири', 0, 9999)
    checkRange(carbs_g, 'Вуглеводи', 0, 9999)
  } catch (err) {
    return res.status(400).json({ error: err.message })
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
  } catch {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Видаляє запис про їжу, якщо він належить поточному користувачу.
 *
 * Виконує видалення за ідентифікатором запису та user_id. Якщо запис не знайдено,
 * повертає 404.
 * @param {object} req HTTP-запит з id запису в параметрах маршруту.
 * @param {object} res HTTP-відповідь з підтвердженням видалення або повідомленням про помилку.
 * @returns {Promise<void>}
 */
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
  } catch {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Повертає список власних продуктів, створених поточним користувачем.
 *
 * Результат сортується за назвою у алфавітному порядку.
 * @param {object} req HTTP-запит з даними авторизованого користувача.
 * @param {object} res HTTP-відповідь зі списком користувацьких продуктів або повідомленням про помилку.
 * @returns {Promise<void>}
 */
const getCustomFoods = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM custom_foods WHERE user_id = $1 ORDER BY name ASC',
      [req.user.id]
    )
    res.json(result.rows)
  } catch {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Додає власний продукт до персонального списку користувача.
 *
 * Перевіряє наявність обов'язкових полів і створює запис у таблиці custom_foods.
 * Значення білків, жирів і вуглеводів за замовчуванням дорівнюють 0, якщо їх не передано.
 * @param {object} req HTTP-запит з даними продукту в тілі запиту.
 * @param {object} res HTTP-відповідь зі створеним продуктом або повідомленням про помилку.
 * @returns {Promise<void>}
 */
const addCustomFood = async (req, res) => {
  const { name, kcal_per100, protein_per100, fat_per100, carbs_per100 } = req.body

  if (!name || !kcal_per100) {
    return res.status(400).json({ error: 'Назва та калорії обовʼязкові' })
  }

  try {
    checkRange(kcal_per100, 'Ккал на 100г', 0, 9999)
    checkRange(protein_per100, 'Білки на 100г', 0, 100)
    checkRange(fat_per100, 'Жири на 100г', 0, 100)
    checkRange(carbs_per100, 'Вуглеводи на 100г', 0, 100)

    const sumMacros = (+protein_per100 || 0) + (+fat_per100 || 0) + (+carbs_per100 || 0)
    if (sumMacros > 100) {
      return res.status(400).json({ error: 'Сума білків, жирів і вуглеводів не може перевищувати 100 г на 100 г продукту' })
    }
  } catch (err) {
    return res.status(400).json({ error: err.message })
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
  } catch {
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

/**
 * Виконує пошук продуктів через USDA FoodData Central API і повертає
 * нормалізований список продуктів з основними харчовими показниками.
 *
 * Отримує пошуковий запит з req.query.q, звертається до зовнішнього API,
 * виділяє калорії, білки, жири та вуглеводи й перетворює відповідь у формат,
 * який використовує клієнтська частина застосунку.
 * 
 * Алгоритм нормалізації відповіді USDA:
 * зовнішній API повертає поживні значення як масив foodNutrients,
 * де кожен показник визначається числовим nutrientId.
 * Для роботи застосунку відповідь перетворюється у спрощену структуру
 * з полями kcal_per100, protein_per100, fat_per100 і carbs_per100.
 *
 * Використані nutrientId:
 * - 1008 це калорії
 * - 1003 це білки
 * - 1004 це жири
 * - 1005 це вуглеводи
 * @param {object} req HTTP-запит з пошуковим рядком у query-параметрі q.
 * @param {object} res HTTP-відповідь зі списком знайдених продуктів або повідомленням про помилку.
 * @returns {Promise<void>}
 */
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
      console.log('USDA статус:', apiRes.statusCode)
      console.log('USDA відповідь (перші 500 символів):', data.slice(0, 500))
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
        console.error('помилка парсингу USDA відповіді', e)
        res.status(500).json({ error: 'Помилка обробки відповіді USDA' })
      }
    })
  }).on('error', () => {
    res.status(500).json({ error: 'Помилка підключення до USDA API' })
  })
}

/**
 * Видаляє власний продукт користувача.
 *
 * Перевіряє, що продукт належить поточному користувачу (за user_id),
 * щоб користувач не міг видалити чужий продукт.
 * Якщо продукт не знайдений або належить іншому користувачу,
 * повертає 404.
 * @param {object} req HTTP-запит з параметром id у шляху.
 * @param {object} res HTTP-відповідь з підтвердженням або повідомленням про помилку.
 * @returns {Promise<void>}
 */
const deleteCustomFood = async (req, res) => {
  const userId = req.user.id
  const { id } = req.params

  try {
    const result = await pool.query(
      'DELETE FROM custom_foods WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Продукт не знайдено' })
    }
    res.json({ success: true })
  } catch (err) {
    console.error('Delete custom food error:', err)
    res.status(500).json({ error: 'Помилка сервера' })
  }
}

module.exports = {
  getFoodLogs, getFoodStats, addFoodLog, deleteFoodLog,
  getCustomFoods, addCustomFood, deleteCustomFood, searchUSDA,
}