const pool = require('./db')

const createTables = async () => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        age          INTEGER,
        sex          VARCHAR(10),
        weight       NUMERIC(5,2),
        height       NUMERIC(5,2),
        activity     VARCHAR(20) DEFAULT 'moderate',
        goal         VARCHAR(20) DEFAULT 'maintain',
        water_goal   INTEGER DEFAULT 2000,
        bmr          INTEGER,
        tdee         INTEGER,
        calorie_goal INTEGER,
        updated_at   TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS food_logs (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
        log_date   DATE NOT NULL DEFAULT CURRENT_DATE,
        meal_type  VARCHAR(20) NOT NULL,
        food_name  VARCHAR(255) NOT NULL,
        amount_g   NUMERIC(7,2) NOT NULL,
        kcal       NUMERIC(7,2) DEFAULT 0,
        protein_g  NUMERIC(7,2) DEFAULT 0,
        fat_g      NUMERIC(7,2) DEFAULT 0,
        carbs_g    NUMERIC(7,2) DEFAULT 0,
        usda_fdc_id VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS custom_foods (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name            VARCHAR(255) NOT NULL,
        kcal_per100     NUMERIC(7,2) NOT NULL,
        protein_per100  NUMERIC(7,2) DEFAULT 0,
        fat_per100      NUMERIC(7,2) DEFAULT 0,
        carbs_per100    NUMERIC(7,2) DEFAULT 0,
        created_at      TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query('COMMIT')
    console.log('Таблиці створено успішно')
  } catch(err) {
    await client.query('ROLLBACK')
    console.error('Помилка створення таблиць:', err)
    throw err
  } finally {
    client.release()
  }
}

module.exports = createTables