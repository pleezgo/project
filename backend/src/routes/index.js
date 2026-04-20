/**
 * Центральний опис HTTP-маршрутів backend API.
 *
 * Цей модуль пов'язує URL-ендпоінти з відповідними контролерами
 * та визначає, які маршрути доступні без автентифікації, а які
 * вимагають перевірки JWT через middleware auth.
 *
 * Структура маршрутів відображає основні функціональні напрями
 * застосунку: автентифікація, профіль користувача, dashboard,
 * щоденник харчування, статистика та власні продукти.
 */

const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

const { register, login } = require('../controllers/authController')
const { getProfile, updateProfile } = require('../controllers/profileController')
const {
  getFoodLogs, getFoodStats, addFoodLog, deleteFoodLog,
  getCustomFoods, addCustomFood, searchUSDA,
} = require('../controllers/foodController')

const { getDashboard } = require('../controllers/dashboardController')
const {
  getExercises, getActivityLogs, addActivityLog, deleteActivityLog,
  getWeightLog, addWeightLog
} = require('../controllers/activityController')

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Реєстрація нового користувача
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Соляр Захар
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: secret123
 *     responses:
 *       201:
 *         description: Користувача успішно зареєстровано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: jwtTokenExample123...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: user@example.com
 *                     name:
 *                       type: string
 *                       nullable: true
 *                       example: Соляр Захар
 *       400:
 *         description: Некоректні вхідні дані
 *       409:
 *         description: Email вже використовується
 *       500:
 *         description: Помилка сервера
 */
router.post('/auth/register', register)

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Вхід користувача в систему
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Користувача успішно автентифіковано
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: jwtTokenExample123...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: user@example.com
 *                     name:
 *                       type: string
 *                       nullable: true
 *                       example: Соляр Захар
 *       400:
 *         description: Email і пароль обов’язкові
 *       401:
 *         description: Невірний email або пароль
 *       500:
 *         description: Помилка сервера
 */
router.post('/auth/login', login)

/**
 * @openapi
 * /profile:
 *   get:
 *     summary: Отримання профілю поточного користувача
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Дані профілю користувача
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 email:
 *                   type: string
 *                   example: user@example.com
 *                 name:
 *                   type: string
 *                   example: Соляр Захар
 *                 age:
 *                   type: integer
 *                   example: 25
 *                 sex:
 *                   type: string
 *                   example: male
 *                 weight:
 *                   type: number
 *                   example: 75
 *                 height:
 *                   type: number
 *                   example: 180
 *                 activity:
 *                   type: string
 *                   example: moderate
 *                 goal:
 *                   type: string
 *                   example: maintain
 *                 calorie_goal:
 *                   type: integer
 *                   example: 2500
 *       401:
 *         description: Неавторизований користувач
 *       404:
 *         description: Профіль не знайдено
 *       500:
 *         description: Помилка сервера
 */
router.get('/profile', auth, getProfile)

/**
 * @openapi
 * /profile:
 *   put:
 *     summary: Оновлення профілю користувача
 *     tags:
 *       - Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Соляр Захар
 *               age:
 *                 type: integer
 *                 example: 25
 *               sex:
 *                 type: string
 *                 example: male
 *               weight:
 *                 type: number
 *                 example: 75
 *               height:
 *                 type: number
 *                 example: 180
 *               activity:
 *                 type: string
 *                 example: moderate
 *               goal:
 *                 type: string
 *                 example: maintain
 *               water_goal:
 *                 type: integer
 *                 example: 2000
 *     responses:
 *       200:
 *         description: Профіль успішно оновлено
 *       401:
 *         description: Неавторизований користувач
 *       500:
 *         description: Помилка сервера
 */
router.put('/profile', auth, updateProfile)

/**
 * @openapi
 * /dashboard:
 *   get:
 *     summary: Отримання зведених даних для дашборда
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2026-03-25
 *         description: Дата, за яку потрібно отримати зведені дані
 *     responses:
 *       200:
 *         description: Зведені дані для дашборда
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                 totals:
 *                   type: object
 *                   properties:
 *                     kcal:
 *                       type: number
 *                       example: 1850
 *                     protein_g:
 *                       type: number
 *                       example: 110
 *                     fat_g:
 *                       type: number
 *                       example: 70
 *                     carbs_g:
 *                       type: number
 *                       example: 190
 *       401:
 *         description: Неавторизований користувач
 *       500:
 *         description: Помилка сервера
 */
router.get('/dashboard', auth, getDashboard)

/**
 * @openapi
 * /food:
 *   get:
 *     summary: Отримання записів харчування за дату
 *     tags:
 *       - Food
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *           example: 2025-01-15
 *         description: Дата, за яку потрібно отримати записи харчування
 *     responses:
 *       200:
 *         description: Список записів харчування
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   meal_type:
 *                     type: string
 *                     example: breakfast
 *                   food_name:
 *                     type: string
 *                     example: Вівсянка
 *                   amount_g:
 *                     type: number
 *                     example: 100
 *                   kcal:
 *                     type: number
 *                     example: 68
 *                   protein_g:
 *                     type: number
 *                     example: 2.4
 *                   fat_g:
 *                     type: number
 *                     example: 1.4
 *                   carbs_g:
 *                     type: number
 *                     example: 12
 *       401:
 *         description: Неавторизований користувач
 *       500:
 *         description: Помилка сервера
 */
router.get('/food', auth, getFoodLogs)

/**
 * @openapi
 * /food/stats:
 *   get:
 *     summary: Отримання статистики харчування за період
 *     tags:
 *       - Food
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         required: false
 *         schema:
 *           type: integer
 *           example: 7
 *         description: Кількість днів для побудови статистики
 *     responses:
 *       200:
 *         description: Статистика харчування за днями
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   log_date:
 *                     type: string
 *                     format: date
 *                     example: 2025-01-15
 *                   kcal:
 *                     type: number
 *                     example: 1850
 *                   protein_g:
 *                     type: number
 *                     example: 110
 *                   fat_g:
 *                     type: number
 *                     example: 70
 *                   carbs_g:
 *                     type: number
 *                     example: 190
 *       401:
 *         description: Неавторизований користувач
 *       500:
 *         description: Помилка сервера
 */
router.get('/food/stats', auth, getFoodStats)

/**
 * @openapi
 * /food/search:
 *   get:
 *     summary: Пошук продуктів через USDA FoodData Central API
 *     tags:
 *       - Food
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           example: oatmeal
 *         description: Пошуковий запит для пошуку продуктів
 *     responses:
 *       200:
 *         description: Список знайдених продуктів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   fdcId:
 *                     type: integer
 *                     example: 123456
 *                   name:
 *                     type: string
 *                     example: Oatmeal
 *                   brand:
 *                     type: string
 *                     nullable: true
 *                     example: Quaker
 *                   kcal_per100:
 *                     type: number
 *                     example: 68
 *                   protein_per100:
 *                     type: number
 *                     example: 2.4
 *                   fat_per100:
 *                     type: number
 *                     example: 1.4
 *                   carbs_per100:
 *                     type: number
 *                     example: 12
 *       400:
 *         description: Пошуковий запит не передано
 *       401:
 *         description: Неавторизований користувач
 *       500:
 *         description: Помилка сервера
 */
router.get('/food/search', auth, searchUSDA)

/**
 * @openapi
 * /food/custom:
 *   get:
 *     summary: Отримання власних продуктів користувача
 *     tags:
 *       - Food
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список власних продуктів
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: Домашній салат
 *                   kcal_per100:
 *                     type: number
 *                     example: 120
 *                   protein_per100:
 *                     type: number
 *                     example: 5
 *                   fat_per100:
 *                     type: number
 *                     example: 7
 *                   carbs_per100:
 *                     type: number
 *                     example: 10
 *       401:
 *         description: Неавторизований користувач
 *       500:
 *         description: Помилка сервера
 */
router.get('/food/custom', auth, getCustomFoods)

/**
 * @openapi
 * /food:
 *   post:
 *     summary: Додавання запису харчування
 *     tags:
 *       - Food
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - meal_type
 *               - food_name
 *               - amount_g
 *             properties:
 *               meal_type:
 *                 type: string
 *                 example: breakfast
 *               food_name:
 *                 type: string
 *                 example: Вівсянка
 *               amount_g:
 *                 type: number
 *                 example: 100
 *               kcal:
 *                 type: number
 *                 example: 68
 *               protein_g:
 *                 type: number
 *                 example: 2.4
 *               fat_g:
 *                 type: number
 *                 example: 1.4
 *               carbs_g:
 *                 type: number
 *                 example: 12
 *               log_date:
 *                 type: string
 *                 format: date
 *                 example: 2025-01-15
 *               usda_fdc_id:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Запис харчування успішно додано
 *       400:
 *         description: Некоректні вхідні дані
 *       401:
 *         description: Неавторизований користувач
 *       500:
 *         description: Помилка сервера
 */
router.post('/food', auth, addFoodLog)

/**
 * @openapi
 * /food/custom:
 *   post:
 *     summary: Додавання власного продукту користувача
 *     tags:
 *       - Food
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - kcal_per100
 *             properties:
 *               name:
 *                 type: string
 *                 example: Домашній салат
 *               kcal_per100:
 *                 type: number
 *                 example: 120
 *               protein_per100:
 *                 type: number
 *                 example: 5
 *               fat_per100:
 *                 type: number
 *                 example: 7
 *               carbs_per100:
 *                 type: number
 *                 example: 10
 *     responses:
 *       201:
 *         description: Власний продукт успішно додано
 *       400:
 *         description: Некоректні вхідні дані
 *       401:
 *         description: Неавторизований користувач
 *       500:
 *         description: Помилка сервера
 */
router.post('/food/custom', auth, addCustomFood)

/**
 * @openapi
 * /food/{id}:
 *   delete:
 *     summary: Видалення запису харчування
 *     tags:
 *       - Food
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Ідентифікатор запису харчування
 *     responses:
 *       200:
 *         description: Запис харчування успішно видалено
 *       401:
 *         description: Неавторизований користувач
 *       404:
 *         description: Запис не знайдено
 *       500:
 *         description: Помилка сервера
 */
router.delete('/food/:id', auth, deleteFoodLog)

router.get('/exercises', auth, getExercises)

router.get('/activity', auth, getActivityLogs)
router.post('/activity', auth, addActivityLog)
router.delete('/activity/:id', auth, deleteActivityLog)

router.get('/weight', auth, getWeightLog)
router.post('/weight', auth, addWeightLog)

module.exports = router