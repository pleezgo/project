/**
 * Розраховує цілі КБЖВ на основі calorie_goal з профілю.
 * Розподіл: 25% білки, 30% жири, 45% вуглеводи
 * @param calorieGoal
 */
export const calcMacroGoals = (calorieGoal = 2000) => ({
  kcal: calorieGoal,
  protein: Math.round(calorieGoal * 0.25 / 4),
  fat: Math.round(calorieGoal * 0.30 / 9),
  carbs: Math.round(calorieGoal * 0.45 / 4),
})

/**
 * Обчислює відсоток виконання цілі в межах від 0 до 100.
 * @param {number} value Поточне значення.
 * @param {number} max Цільове значення.
 * @returns {number} Відсоток виконання.
 */
export const pct = (value, max) => Math.min(100, Math.round(value / (max || 1) * 100))

/**
 * Розраховує нутрієнти для заданої кількості грамів на основі значень на 100г
 * @param food
 * @param amountG
 */
export const calcNutrients = (food, amountG) => {
  const k = amountG / 100
  return {
    kcal: Math.round((food.kcal_per100 || 0) * k),
    protein_g: +((food.protein_per100 || 0) * k).toFixed(1),
    fat_g: +((food.fat_per100 || 0) * k).toFixed(1),
    carbs_g: +((food.carbs_per100 || 0) * k).toFixed(1),
  }
}
