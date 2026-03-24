const { Pool } = require('pg')
require('dotenv').config()

/**
 * Пул підключень до PostgreSQL для роботи з базою даних застосунку.
 *
 * Ініціалізується зі змінних середовища та використовується в контролерах
 * і конфігураційних модулях для виконання SQL-запитів.
 * @type {object}
 */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
})

pool.on('error', (err) => {
  console.error('Помилка PostgreSQL:', err)
})

module.exports = pool