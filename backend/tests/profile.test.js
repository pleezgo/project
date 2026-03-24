import { describe, it, expect } from 'vitest'
import { calcBMR, calcTDEE, calcCalorieGoal } from '../src/controllers/profileController.js'

describe('Profile calculations', () => {
  it('calculates BMR for male correctly', () => {
    const result = calcBMR(70, 175, 25, 'male')
    expect(result).toBe(1674)
  })

  it('calculates TDEE with moderate activity', () => {
    const result = calcTDEE(1700, 'moderate')
    expect(result).toBe(Math.round(1700 * 1.55))
  })

  it('reduces calories for weight loss', () => {
    const result = calcCalorieGoal(2000, 'lose')
    expect(result).toBe(1500)
  })

  it('increases calories for weight gain', () => {
    const result = calcCalorieGoal(2000, 'gain')
    expect(result).toBe(2300)
  })

  it('keeps calories for maintenance', () => {
    const result = calcCalorieGoal(2000, 'maintain')
    expect(result).toBe(2000)
  })
})