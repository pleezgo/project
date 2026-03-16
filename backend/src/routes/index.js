const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

const { register, login } = require('../controllers/authController')
const { getProfile, updateProfile } = require('../controllers/profileController')
const {
  getFoodLogs, getFoodStats, addFoodLog, deleteFoodLog,
  getCustomFoods, addCustomFood, searchUSDA, getDashboard,
} = require('../controllers/foodController')

router.post('/auth/register', register)
router.post('/auth/login', login)

router.get('/profile', auth, getProfile)
router.put('/profile', auth, updateProfile)

router.get('/dashboard', auth, getDashboard)

router.get('/food', auth, getFoodLogs)
router.get('/food/stats', auth, getFoodStats)
router.get('/food/search', auth, searchUSDA)
router.get('/food/custom', auth, getCustomFoods)
router.post('/food', auth, addFoodLog)
router.post('/food/custom', auth, addCustomFood)
router.delete('/food/:id', auth, deleteFoodLog)

module.exports = router