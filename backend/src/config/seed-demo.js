/**
 * Скрипт наповнення системи демонстраційними даними.
 *
 * Створює тестових користувачів з заповненими профілями, а також записи
 * харчування, фізичної активності, гідрації та сну за останні 30 днів.
 *
 * Запуск:
 * node src/config/seed-demo.js - додає демо-користувачів
 * node src/config/seed-demo.js --clean - видаляє раніше створених демо-користувачів
 *
 * Демо-користувачі позначені email-доменом @demo.local — за цим маркером
 * їх можна знайти і видалити повторним запуском з прапором --clean.
 */

const bcrypt = require('bcrypt')
const pool = require('./db')
const { calcBMR, calcTDEE, calcCalorieGoal } = require('../utils/calculations')

const DEMO_DOMAIN = '@demo.local'

const SEXES = ['male', 'female']
const ACTIVITIES = ['sedentary', 'light', 'moderate', 'active', 'very_active']
const GOALS = ['lose', 'maintain', 'gain']

const FOOD_PRESETS = [
  { name: 'Caesar Salad', kcal_per100: 180, p: 9, f: 13, c: 6 },
  { name: 'Chicken Breast', kcal_per100: 165, p: 31, f: 3.6, c: 0 },
  { name: 'Rice', kcal_per100: 130, p: 2.7, f: 0.3, c: 28 },
  { name: 'Buckwheat', kcal_per100: 343, p: 13, f: 3, c: 72 },
  { name: 'Banana', kcal_per100: 89, p: 1.1, f: 0.3, c: 23 },
  { name: 'Apple', kcal_per100: 52, p: 0.3, f: 0.2, c: 14 },
  { name: 'Egg', kcal_per100: 155, p: 13, f: 11, c: 1.1 },
  { name: 'Greek Yogurt', kcal_per100: 59, p: 10, f: 0.4, c: 3.6 },
  { name: 'Bread', kcal_per100: 265, p: 9, f: 3.2, c: 49 },
  { name: 'Cottage Cheese', kcal_per100: 98, p: 11, f: 4.3, c: 3.4 },
  { name: 'Salmon', kcal_per100: 208, p: 20, f: 13, c: 0 },
  { name: 'Oatmeal', kcal_per100: 68, p: 2.4, f: 1.4, c: 12 },
  { name: 'Pasta', kcal_per100: 131, p: 5, f: 1.1, c: 25 },
  { name: 'Tomato', kcal_per100: 18, p: 0.9, f: 0.2, c: 3.9 },
  { name: 'Cucumber', kcal_per100: 15, p: 0.7, f: 0.1, c: 3.6 },
]

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack']

const HYDRATION_AMOUNTS = [200, 250, 300, 350, 500]

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randFloat = (min, max, dec = 1) => +(Math.random() * (max - min) + min).toFixed(dec)

/**
 * Видаляє всіх демо-користувачів
 */
const cleanDemoUsers = async () => {
  const result = await pool.query(
    `DELETE FROM users WHERE email LIKE $1 RETURNING email`,
    [`%${DEMO_DOMAIN}`]
  )
  console.log(`Видалено демо-користувачів: ${result.rows.length}`)
}

/**
 * Створює одного демо-користувача з повним профілем і записами за 30 днів.
 */
const createDemoUser = async (i) => {
  const fullName = `Користувач ${i + 1}`
  const email = `demo${i + 1}${DEMO_DOMAIN}`
  const password = await bcrypt.hash('demo123', 10)

  const age = randInt(20, 55)
  const sex = randChoice(SEXES)
  const weight = randFloat(55, 95, 1)
  const height = randInt(160, 195)
  const activity = randChoice(ACTIVITIES)
  const goal = randChoice(GOALS)
  const bmr = calcBMR(weight, height, age, sex)
  const tdee = calcTDEE(bmr, activity)
  const calorie_goal = calcCalorieGoal(tdee, goal)

  // Створення користувача
  const userResult = await pool.query(
    `INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id`,
    [email, password, fullName]
  )
  const userId = userResult.rows[0].id

  // Профіль
  await pool.query(
    `INSERT INTO user_profiles
      (user_id, age, sex, weight, height, activity, goal, bmr, tdee, calorie_goal)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [userId, age, sex, weight, height, activity, goal, bmr, tdee, calorie_goal]
  )

  // Налаштування (порожні)
  await pool.query(
    `INSERT INTO user_settings (user_id) VALUES ($1)`,
    [userId]
  )

  // Дані за 30 днів
  const today = new Date()
  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)
    const logDate = date.toISOString().split('T')[0]

    // Харчування: 3-4 прийоми їжі на день
    const mealsToday = randInt(2, 4)
    for (let m = 0; m < mealsToday; m++) {
      const food = randChoice(FOOD_PRESETS)
      const amount = randInt(80, 300)
      const ratio = amount / 100
      await pool.query(
        `INSERT INTO food_logs
          (user_id, log_date, meal_type, food_name, amount_g, kcal, protein_g, fat_g, carbs_g)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          userId, logDate, MEALS[m % MEALS.length],
          food.name, amount,
          Math.round(food.kcal_per100 * ratio),
          +(food.p * ratio).toFixed(1),
          +(food.f * ratio).toFixed(1),
          +(food.c * ratio).toFixed(1),
        ]
      )
    }

    // Активність: приблизно 50% днів є тренування
    if (Math.random() < 0.55) {
      const exerciseResult = await pool.query(
        `SELECT id, name, category FROM exercises ORDER BY RANDOM() LIMIT 1`
      )
      if (exerciseResult.rows.length > 0) {
        const ex = exerciseResult.rows[0]
        const intensity = randChoice(['low', 'moderate', 'high'])
        const params = {
          duration_min: null,
          distance_km: null,
          sets: null,
          reps: null,
          weight_used_kg: null,
        }
        if (ex.category === 'cardio_distance') {
          params.distance_km = randFloat(2, 10, 1)
          params.duration_min = randInt(15, 60)
        } else if (ex.category === 'cardio_time' || ex.category === 'isometric') {
          params.duration_min = randInt(10, 45)
        } else if (ex.category === 'bodyweight_reps') {
          params.sets = randInt(3, 5)
          params.reps = randInt(8, 20)
        } else if (ex.category === 'weighted_reps') {
          params.sets = randInt(3, 5)
          params.reps = randInt(6, 12)
          params.weight_used_kg = randInt(20, 80)
        }
        const kcal = randInt(150, 500)
        await pool.query(
          `INSERT INTO activity_logs
            (user_id, log_date, exercise_id, exercise_name, category, duration_min, distance_km, sets, reps, weight_used_kg, intensity, kcal_burned)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            userId, logDate, ex.id, ex.name, ex.category,
            params.duration_min, params.distance_km,
            params.sets, params.reps, params.weight_used_kg,
            intensity, kcal,
          ]
        )
      }
    }

    // Гідрація: 4-8 порцій
    const drinks = randInt(4, 8)
    for (let d = 0; d < drinks; d++) {
      await pool.query(
        `INSERT INTO hydration_logs (user_id, log_date, amount_ml) VALUES ($1, $2, $3)`,
        [userId, logDate, randChoice(HYDRATION_AMOUNTS)]
      )
    }

    // Сон: один нічний запис
    const sleepHours = randFloat(5.5, 9.5, 1)
    const sleepMinutes = Math.round(sleepHours * 60)
    const sleepStartHour = randInt(21, 24)
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - 1)
    startDate.setHours(sleepStartHour % 24, randInt(0, 59), 0, 0)
    if (sleepStartHour === 24) startDate.setDate(startDate.getDate() + 1)
    const wakeDate = new Date(startDate.getTime() + sleepMinutes * 60 * 1000)
    const quality = randInt(2, 5)
    await pool.query(
      `INSERT INTO sleep_logs (user_id, log_date, sleep_type, sleep_start, sleep_end, duration_min, quality)
       VALUES ($1, $2, 'night', $3, $4, $5, $6)`,
      [userId, logDate, startDate, wakeDate, sleepMinutes, quality]
    )

    // Вага: вимірювання раз на 3-5 днів
    if (dayOffset % randInt(3, 5) === 0) {
      const weightVariation = randFloat(-0.5, 0.5, 1)
      await pool.query(
        `INSERT INTO weight_logs (user_id, log_date, weight)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, log_date) DO UPDATE SET weight = EXCLUDED.weight`,
        [userId, logDate, +(weight + weightVariation).toFixed(1)]
      )
    }
  }

  console.log(`Створено: ${email} (${fullName}, ${age}р, ${weight}кг)`)
}

const main = async () => {
  const args = process.argv.slice(2)
  if (args.includes('--clean')) {
    await cleanDemoUsers()
    console.log('Готово.')
    process.exit(0)
  }

  const existingResult = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM users WHERE email LIKE $1`,
    [`%${DEMO_DOMAIN}`]
  )
  const offset = existingResult.rows[0].cnt

  console.log(`Існуючих демо-користувачів: ${offset}`)
  console.log('Створення 20 нових демо-користувачів з даними за 90 днів...')

  for (let i = 0; i < 20; i++) {
    try {
      await createDemoUser(offset + i)
    } catch (err) {
      console.error(`Помилка для користувача ${offset + i + 1}:`, err.message)
    }
  }

  console.log('\nГотово!')
  console.log('Усі демо-користувачі мають пароль: demo123')
  console.log('Для видалення: node src/config/seed-demo.js --clean')
  process.exit(0)
}

main().catch(err => {
  console.error('Фатальна помилка:', err)
  process.exit(1)
})