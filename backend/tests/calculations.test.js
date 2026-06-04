import { describe, it, expect } from 'vitest'
import {
  calcBMR, calcTDEE, calcCalorieGoal,
  pickMET, calcExerciseKcal, calcActivityGoal,
} from '../src/utils/calculations.js'

describe('Розрахунок основного обміну (BMR)', () => {
  it('обчислює BMR для чоловіка за формулою Міффліна-Сан-Жеора', () => {
    expect(calcBMR(70, 175, 25, 'male')).toBe(1674)
  })

  it('обчислює BMR для жінки (на 166 менше за формулою)', () => {
    expect(calcBMR(60, 165, 30, 'female')).toBe(1320)
  })
})

describe('Розрахунок добових енерговитрат (TDEE)', () => {
  it('застосовує коефіцієнт для сидячого способу життя', () => {
    expect(calcTDEE(1700, 'sedentary')).toBe(Math.round(1700 * 1.2))
  })

  it('застосовує коефіцієнт для помірної активності', () => {
    expect(calcTDEE(1700, 'moderate')).toBe(Math.round(1700 * 1.55))
  })

  it('застосовує коефіцієнт для дуже високої активності', () => {
    expect(calcTDEE(1700, 'very_active')).toBe(Math.round(1700 * 1.9))
  })
})

describe('Розрахунок цільової калорійності', () => {
  it('зменшує калорії на 500 для схуднення', () => {
    expect(calcCalorieGoal(2000, 'lose')).toBe(1500)
  })

  it('збільшує калорії на 300 для набору маси', () => {
    expect(calcCalorieGoal(2000, 'gain')).toBe(2300)
  })

  it('залишає калорії без змін для підтримки', () => {
    expect(calcCalorieGoal(2000, 'maintain')).toBe(2000)
  })
})

describe('Вибір MET за інтенсивністю', () => {
  const exercise = { met_low: 4, met_moderate: 7, met_high: 10 }

  it('повертає met_low для низької інтенсивності', () => {
    expect(pickMET(exercise, 'low')).toBe(4)
  })

  it('повертає met_high для високої інтенсивності', () => {
    expect(pickMET(exercise, 'high')).toBe(10)
  })

  it('повертає met_moderate за замовчуванням', () => {
    expect(pickMET(exercise, 'moderate')).toBe(7)
  })
})

describe('Розрахунок калорій вправи', () => {
  it('обчислює калорії для кардіо за часом', () => {
    const exercise = { category: 'cardio_time', met_moderate: 8 }
    const params = { duration_min: 30, intensity: 'moderate' }
    expect(calcExerciseKcal(exercise, params, 70)).toBe(294)
  })

  it('обчислює калорії для силової вправи з підходами', () => {
    const exercise = { category: 'bodyweight_reps', met_moderate: 4, seconds_per_rep: 3 }
    const params = { sets: 3, reps: 10, intensity: 'moderate' }
    expect(calcExerciseKcal(exercise, params, 70)).toBe(7)
  })

  it('повертає 0 для силової вправи без підходів', () => {
    const exercise = { category: 'bodyweight_reps', met_moderate: 4 }
    const params = { sets: 0, reps: 0 }
    expect(calcExerciseKcal(exercise, params, 70)).toBe(0)
  })
})

describe('Розрахунок цілі активності', () => {
  it('повертає 400 ккал для схуднення', () => {
    expect(calcActivityGoal('lose')).toBe(400)
  })

  it('повертає 200 ккал для набору маси', () => {
    expect(calcActivityGoal('gain')).toBe(200)
  })

  it('повертає 300 ккал для підтримки', () => {
    expect(calcActivityGoal('maintain')).toBe(300)
  })
})