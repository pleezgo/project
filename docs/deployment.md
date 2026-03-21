# Розгортання у production середовищі

## Вимоги до апаратного забезпечення

- **CPU:** 1 ядро
- **RAM:** 512 MB мінімум, 1 GB рекомендовано
- **Диск:** 1 GB мінімум
- **Архітектура:** x86_64 або ARM64

## Необхідне програмне забезпечення та налаштування мережі

- **ОС:** будь-яка сучасна Linux дистрибуція або Windows
- **Node.js:** v24+
- **npm:** v11+
- **PostgreSQL:** v17+
- **Мережа:** порти 80/443 відкриті для frontend, порт 5000 відкритий для backend API (налаштовується через `PORT` у `.env`), порт 5432 закритий ззовні, доступний лише для backend

## Конфігурація сервера

Застосунок може бути розгорнутий на будь-якому Linux сервері або хмарній платформі (наприклад Railway).

Перед запуском необхідно налаштувати змінні оточення відповідно до свого середовища.

**Backend** (`.env`):
- `PORT` - порт на якому запускається сервер
- `DB_HOST` - хост бази даних
- `DB_PORT` - порт бази даних
- `DB_NAME` - назва бази даних
- `DB_USER` - користувач бази даних
- `DB_PASSWORD` - пароль бази даних
- `JWT_SECRET` - секретний ключ для JWT токенів
- `USDA_API_KEY` - API ключ USDA FoodData Central
- `FRONTEND_URL` - URL frontend застосунку

**Frontend** (змінні оточення платформи):
- `VITE_API_URL` - URL backend API
- `ALLOWED_HOSTS` - дозволені хости для frontend

## Налаштування PostgreSQL

1. Створи базу даних:
```sql
CREATE DATABASE your_database_name;
```
2. Встанови змінні підключення у конфігурації сервера (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
3. Таблиці створюються автоматично при першому запуску backend

## Розгортання коду

1. Клонуй репозиторій та встанови залежності:
```bash
git clone https://github.com/pleezgo/project.git
cd project
cd backend
npm install
cd ../frontend
npm install
```
2. Запусти backend:
```bash
cd backend
npm start
```
3. Запусти frontend:
```bash
cd frontend
npm run build
npm run preview
```

### Автоматизація запуску

Для зручності можна використати готові скрипти з папки `docs/scripts/`:

- Linux: `bash docs/scripts/prod.sh`
- Windows: `docs\scripts\prod.bat`

### Розгортання через Docker

Альтернативний спосіб розгортання за допомогою Docker та Docker Compose.

1. Встанови Docker та Docker Compose
2. Створи `.env` в корені проекту на основі `.env.docker-example`
3. Запусти всі сервіси:
```bash
docker-compose up --build
```

Для зупинки:
```bash
docker-compose down
```

## Перевірка працездатності

1. Відкрий URL frontend - має завантажитись застосунок
2. Зареєструйся - підтверджує що backend і PostgreSQL працюють коректно
3. Знайди продукт через пошук - підтверджує що USDA API ключ валідний
