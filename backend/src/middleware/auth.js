const jwt = require('jsonwebtoken')

/**
 * Перевіряє JWT-токен у заголовку Authorization і додає дані користувача до req.user.
 *
 * Очікує токен у форматі Bearer token. Якщо токен відсутній, повертає 401.
 * Якщо токен невалідний або прострочений, повертає 403.
 * @param {object} req HTTP-запит із заголовком Authorization.
 * @param {object} res HTTP-відповідь із повідомленням про помилку у разі неуспішної перевірки.
 * @param {function(): void} next Функція передачі керування наступному middleware або обробнику.
 * @returns {void}
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Токен відсутній' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(403).json({ error: 'Недійсний токен' })
  }
}

/**
 * Перевіряє, що поточний користувач має роль адміністратора.
 *
 * Використовується після authMiddleware, який вже додав
 * req.user з даними з JWT-токена (включно з полем role).
 * Якщо роль не дорівнює 'admin', повертає 403.
 * @param {object} req HTTP-запит з даними автентифікованого користувача.
 * @param {object} res HTTP-відповідь з помилкою у разі недостатніх прав.
 * @param {Function} next Функція передачі керування наступному middleware.
 * @returns {void}
 */
const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Доступ заборонено' })
  }
  next()
}

module.exports = authMiddleware
module.exports.requireAdmin = requireAdmin