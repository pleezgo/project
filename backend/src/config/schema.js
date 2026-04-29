const pool = require('./db')

/**
 * Створює основні таблиці бази даних застосунку, якщо вони ще не існують.
 *
 * Виконує ініціалізацію схеми в межах транзакції, створюючи таблиці users,
 * user_profiles, food_logs і custom_foods. У разі помилки виконує rollback.
 * @returns {Promise<void>}
 */
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
        age           INTEGER,
        sex           VARCHAR(10),
        weight        NUMERIC(5,2),
        height        NUMERIC(5,2),
        activity      VARCHAR(20) DEFAULT 'moderate',
        goal          VARCHAR(20) DEFAULT 'maintain',
        water_goal    INTEGER DEFAULT 2000,
        activity_goal INTEGER,
        bmr           INTEGER,
        tdee          INTEGER,
        calorie_goal  INTEGER,
        updated_at    TIMESTAMP DEFAULT NOW()
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

    await client.query(`
      CREATE TABLE IF NOT EXISTS exercises (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        category VARCHAR(30) NOT NULL,
        met_low NUMERIC(4,1),
        met_moderate NUMERIC(4,1) NOT NULL,
        met_high NUMERIC(4,1),
        supports_duration BOOLEAN DEFAULT FALSE,
        supports_distance BOOLEAN DEFAULT FALSE,
        supports_sets_reps BOOLEAN DEFAULT FALSE,
        supports_weight BOOLEAN DEFAULT FALSE,
        seconds_per_rep INTEGER
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        log_date DATE NOT NULL DEFAULT CURRENT_DATE,
        exercise_id INTEGER REFERENCES exercises(id),
        exercise_name VARCHAR(255) NOT NULL,
        category VARCHAR(30) NOT NULL,
        duration_min NUMERIC(6,1),
        distance_km NUMERIC(6,2),
        sets INTEGER,
        reps INTEGER,
        weight_used_kg NUMERIC(5,1),
        intensity VARCHAR(20) DEFAULT 'moderate',
        kcal_burned NUMERIC(7,1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS weight_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        log_date DATE NOT NULL DEFAULT CURRENT_DATE,
        weight NUMERIC(5,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (user_id, log_date)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS hydration_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        log_date DATE NOT NULL DEFAULT CURRENT_DATE,
        amount_ml INTEGER NOT NULL CHECK (amount_ml > 0 AND amount_ml <= 5000),
        drink_type VARCHAR(20) DEFAULT 'water',
        logged_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS sleep_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        log_date DATE NOT NULL,
        sleep_type VARCHAR(20) DEFAULT 'night',
        sleep_start TIMESTAMPTZ NOT NULL,
        sleep_end TIMESTAMPTZ NOT NULL,
        duration_min INTEGER NOT NULL CHECK (duration_min > 0 AND duration_min <= 1440),
        quality INTEGER CHECK (quality >= 1 AND quality <= 5),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `)

    await client.query('COMMIT')
  } catch(err) {
    await client.query('ROLLBACK')
    console.error('Помилка створення таблиць:', err)
    throw err
  } finally {
    client.release()
  }
}

module.exports = createTables