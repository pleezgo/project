const express = require('express')
const cors = require('cors')
require('dotenv').config()

const routes = require('./routes/index')
const createTables = require('./config/schema')
// const seedExercises = require('./config/seed')

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
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

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Внутрішня помилка сервера' })
})

const PORT = process.env.PORT || 5000

const start = async () => {
  const startTime = new Date()
  try {
    await createTables()
    console.log('таблиці готові')
    app.listen(PORT, () => {
      console.log(`Сервер запущено на порту ${PORT}`)
    })
  } catch (err) {
    console.error('Помилка запуску:', err)
    process.exit(1)
  }
}

start()