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

module.exports = { activityFactors, calcBMR, calcTDEE, calcCalorieGoal }