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

module.exports = authMiddleware