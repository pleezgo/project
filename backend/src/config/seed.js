const pool = require('./db')

// MET значення з Compendium of Physical Activities (2024)
const exercises = [
  // === Кардіо з дистанцією ===
  { name: 'Ходьба', category: 'cardio_distance',
    met_low: 2.8, met_moderate: 3.5, met_high: 5.0,
    supports_duration: true, supports_distance: true },

  { name: 'Біг', category: 'cardio_distance',
    met_low: 7.0, met_moderate: 9.8, met_high: 11.5,
    supports_duration: true, supports_distance: true },

  { name: 'Велосипед', category: 'cardio_distance',
    met_low: 4.0, met_moderate: 6.8, met_high: 10.0,
    supports_duration: true, supports_distance: true },

  // === Кардіо тільки за часом ===
  { name: 'Плавання', category: 'cardio_time',
    met_low: 4.5, met_moderate: 6.0, met_high: 8.3,
    supports_duration: true },

  { name: 'Скакалка', category: 'cardio_time',
    met_low: 8.8, met_moderate: 11.8, met_high: 12.3,
    supports_duration: true },

  { name: 'Еліпсоїд', category: 'cardio_time',
    met_low: 4.0, met_moderate: 5.0, met_high: 7.0,
    supports_duration: true },

  { name: 'Веслування (тренажер)', category: 'cardio_time',
    met_low: 4.8, met_moderate: 7.0, met_high: 8.5,
    supports_duration: true },

  // === Ізометричні (утримання) ===
  { name: 'Планка', category: 'isometric',
    met_moderate: 4.0,
    supports_duration: true },

  { name: 'Стінка (wall sit)', category: 'isometric',
    met_moderate: 5.0,
    supports_duration: true },

  // === Бодівейт силові (підходи + повторення) ===
  { name: 'Віджимання', category: 'bodyweight_reps',
    met_low: 3.5, met_moderate: 3.8, met_high: 8.0,
    supports_sets_reps: true, seconds_per_rep: 2 },

  { name: 'Присідання', category: 'bodyweight_reps',
    met_low: 3.5, met_moderate: 5.0, met_high: 8.0,
    supports_sets_reps: true, seconds_per_rep: 3 },

  { name: 'Підтягування', category: 'bodyweight_reps',
    met_moderate: 8.0, met_high: 8.0,
    supports_sets_reps: true, seconds_per_rep: 3 },

  { name: 'Випади', category: 'bodyweight_reps',
    met_low: 3.5, met_moderate: 5.0, met_high: 8.0,
    supports_sets_reps: true, seconds_per_rep: 3 },

  { name: 'Прес (скручування)', category: 'bodyweight_reps',
    met_moderate: 3.8, met_high: 5.0,
    supports_sets_reps: true, seconds_per_rep: 2 },

  { name: 'Берпі', category: 'bodyweight_reps',
    met_moderate: 8.0, met_high: 10.0,
    supports_sets_reps: true, seconds_per_rep: 4 },

  // === Силові з вагою ===
  { name: 'Гирі (свінг)', category: 'weighted_reps',
    met_low: 5.0, met_moderate: 6.0, met_high: 9.8,
    supports_sets_reps: true, supports_weight: true, seconds_per_rep: 2 },

  { name: 'Жим лежачи', category: 'weighted_reps',
    met_moderate: 5.0, met_high: 6.0,
    supports_sets_reps: true, supports_weight: true, seconds_per_rep: 3 },

  { name: 'Присідання зі штангою', category: 'weighted_reps',
    met_moderate: 5.0, met_high: 6.0,
    supports_sets_reps: true, supports_weight: true, seconds_per_rep: 3 },

  { name: 'Станова тяга', category: 'weighted_reps',
    met_moderate: 6.0, met_high: 8.0,
    supports_sets_reps: true, supports_weight: true, seconds_per_rep: 3 },

  { name: 'Гантелі на біцепс', category: 'weighted_reps',
    met_moderate: 3.5, met_high: 5.0,
    supports_sets_reps: true, supports_weight: true, seconds_per_rep: 3 },
]

const seedExercises = async () => {
  try {
    for (const ex of exercises) {
      await pool.query(
        `INSERT INTO exercises (
          name, category,
          met_low, met_moderate, met_high,
          supports_duration, supports_distance,
          supports_sets_reps, supports_weight,
          seconds_per_rep
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (name) DO NOTHING`,
        [
          ex.name, ex.category,
          ex.met_low || null, ex.met_moderate, ex.met_high || null,
          ex.supports_duration || false, ex.supports_distance || false,
          ex.supports_sets_reps || false, ex.supports_weight || false,
          ex.seconds_per_rep || null,
        ]
      )
    }
    console.log('Базові вправи додано')
  } catch (err) {
    console.error('Помилка seed:', err)
  }
}

module.exports = seedExercises