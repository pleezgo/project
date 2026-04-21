const pickMET = (exercise, intensity) => {
  if (intensity === 'low' && exercise.met_low) return +exercise.met_low
  if (intensity === 'high' && exercise.met_high) return +exercise.met_high
  return +exercise.met_moderate
}

/**
 * Розрахунок калорій для вправи (для preview на фронті).
 * Повна логіка та сама що на бекенді.
 */
export const calcExerciseKcal = (exercise, params, userWeight) => {
  const weight = userWeight || 70
  const intensity = params.intensity || 'moderate'
  const met = pickMET(exercise, intensity)

  if (exercise.category === 'cardio_distance' && params.distance_km > 0) {
    const intensityFactor = met / +exercise.met_moderate
    return Math.round(1.036 * weight * params.distance_km * intensityFactor)
  }

  if ((exercise.category === 'cardio_time' ||
       exercise.category === 'isometric' ||
       exercise.category === 'cardio_distance') && params.duration_min > 0) {
    return Math.round(met * 3.5 * weight / 200 * params.duration_min)
  }

  if (exercise.category === 'bodyweight_reps' || exercise.category === 'weighted_reps') {
    const totalReps = (+params.sets || 0) * (+params.reps || 0)
    if (totalReps <= 0) return 0

    const secPerRep = exercise.seconds_per_rep || 3
    const minutes = totalReps * secPerRep / 60

    let kcal = met * 3.5 * weight / 200 * minutes

    if (exercise.category === 'weighted_reps' && params.weight_used_kg > 0) {
      const weightFactor = 1 + (params.weight_used_kg / weight) * 0.3
      kcal *= weightFactor
    }

    return Math.round(kcal)
  }

  return 0
}

export const categoryLabel = (category) => {
  const labels = {
    cardio_distance: 'Кардіо',
    cardio_time: 'Кардіо',
    isometric: 'Ізометричне',
    bodyweight_reps: 'Силова (бодівейт)',
    weighted_reps: 'Силова (з вагою)',
  }
  return labels[category] || category
}

export const isCardio = (category) => {
  return category === 'cardio_distance' || category === 'cardio_time'
}

export const isStrength = (category) => {
  return category === 'bodyweight_reps' || category === 'weighted_reps' || category === 'isometric'
}