const express = require('express')
const cors = require('cors')
require('dotenv').config()

const routes = require('./routes/index')
const createTables = require('./config/schema')
// const seedExercises = require('./config/seed')

const app = express()

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}))

app.use(express.json())

app.use('/api', routes)

app.get('/', (req, res) => {
  res.json({ message: 'HealthLog API працює!' })
})

app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не знайдено' })
})

app.use((err, req, res, _next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Внутрішня помилка сервера' })
})

const PORT = process.env.PORT || 5000

/**
 * Ініціалізує схему бази даних і запускає HTTP-сервер застосунку.
 *
 * Перед стартом сервера викликає createTables(), щоб переконатися,
 * що необхідні таблиці існують. У разі помилки запуск завершує процес
 * з кодом 1.
 *
 * @returns {Promise<void>}
 */
const start = async () => {
  try {
    await createTables()
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Сервер запущено на порту ${PORT}`)
    })
  } catch (err) {
    console.error('Помилка запуску:', err)
    process.exit(1)
  }
}

start()