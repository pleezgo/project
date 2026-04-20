const pool = require('./db')

const exercises = [
  { name: 'Ходьба', type: 'timed', met: 3.5 },
  { name: 'Біг', type: 'timed', met: 8.0 },
  { name: 'Велосипед', type: 'timed', met: 6.0 },
  { name: 'Плавання', type: 'timed', met: 6.0 },
  { name: 'Скакалка', type: 'timed', met: 10.0 },
  { name: 'Планка', type: 'timed', met: 4.0},
]

const seedExercises = async () => {
  try {
    for (const ex of exercises) {
      await pool.query(
        `INSERT INTO exercises (name, type, met)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO NOTHING`,
        [ex.name, ex.type, ex.met]
      )
    }
    console.log('Базові вправи додано')
  } catch (err) {
    console.error('Помилка seed:', err)
  }
}

module.exports = seedExercises