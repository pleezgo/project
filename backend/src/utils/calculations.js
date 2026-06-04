const activityFactors = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

const calcBMR = (weight, height, age, sex) => {
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(sex === 'female' ? base - 161 : base + 5)
}

const calcTDEE = (bmr, activity) => {
  return Math.round(bmr * (activityFactors[activity] || 1.375))
}

const calcCalorieGoal = (tdee, goal) => {
  if (goal === 'lose') return tdee - 500
  if (goal === 'gain') return tdee + 300
  return tdee
}

const calcActivityGoal = (goal) => {
  if (goal === 'lose') return 400
  if (goal === 'gain') return 200
  return 300
}

/**
 * Вибирає MET значення вправи для заданої інтенсивності.
 * Якщо для рівня немає значення — fallback на moderate.
 */
const pickMET = (exercise, intensity) => {
  if (intensity === 'low' && exercise.met_low) return +exercise.met_low
  if (intensity === 'high' && exercise.met_high) return +exercise.met_high
  return +exercise.met_moderate
}

/**
 * Розраховує калорії для вправи.
 * exercise — об'єкт з таблиці exercises
 * params — { duration_min, distance_km, sets, reps, weight_used_kg, intensity }
 * userWeight — вага користувача в кг
 */
const calcExerciseKcal = (exercise, params, userWeight) => {
  const weight = userWeight || 70
  const intensity = params.intensity || 'moderate'
  const met = pickMET(exercise, intensity)

  // Кардіо з дистанцією — пріоритет за дистанцією
  if (exercise.category === 'cardio_distance' && params.distance_km > 0) {
    // Формула: 1.036 × вага × дистанція (спрощена, добре для бігу)
    // Але множимо на met/met_moderate щоб врахувати інтенсивність
    const intensityFactor = met / +exercise.met_moderate
    return Math.round(1.036 * weight * params.distance_km * intensityFactor)
  }

  // Ізометричні і кардіо за часом
  if ((exercise.category === 'cardio_time' ||
       exercise.category === 'isometric' ||
       exercise.category === 'cardio_distance') && params.duration_min > 0) {
    return Math.round(met * 3.5 * weight / 200 * params.duration_min)
  }

  // Силові — час обчислюється з підходів і повторень
  if (exercise.category === 'bodyweight_reps' || exercise.category === 'weighted_reps') {
    const totalReps = (+params.sets || 0) * (+params.reps || 0)
    if (totalReps <= 0) return 0

    const secPerRep = exercise.seconds_per_rep || 3
    const minutes = totalReps * secPerRep / 60

    let kcal = met * 3.5 * weight / 200 * minutes

    // Для силових з вагою — додатковий множник
    if (exercise.category === 'weighted_reps' && params.weight_used_kg > 0) {
      const weightFactor = 1 + (params.weight_used_kg / weight) * 0.3
      kcal *= weightFactor
    }

    return Math.round(kcal)
  }

  return 0
}

module.exports = { activityFactors, calcBMR, calcTDEE, calcCalorieGoal, pickMET, calcExerciseKcal, calcActivityGoal }