# Про проект
Веб-застосунок для супроводу здорового способу життя. 
Дозволяє вести щоденник харчування з підрахунком КБЖВ, 
пошуком продуктів через USDA FoodData Central API та 
відстеженням денних норм. Планується ведення щоденників харчування, фізичної активності,
гідрації та сну.

## Технології

- **Frontend:** React, Vite, React Router
- **Backend:** Node.js, Express
- **База даних:** PostgreSQL

## Реалізований функціонал

- Реєстрація та авторизація (JWT)
- Щоденник харчування
- Пошук продуктів через USDA API
- Власні продукти
- Розрахунок BMI, BMR, TDEE
- Головна сторінка зі статистикою

## Вимоги

- Node.js v24+
- npm v11+
- PostgreSQL v17+

## Встановлення та запуск

### 1. Клонування та встановлення залежностей
```bash
git clone https://github.com/pleezgo/project.git
cd project
cd backend
npm install
cd ../frontend
npm install
```
Створи файл `backend/.env` і заповни своїми значеннями на основі `backend/.env.example`


### 2. Налаштування бази даних

Створи базу даних:
```sql
CREATE DATABASE your_database_name;
```
Таблиці створюються автоматично при першому запуску backend.

### 3. Запуск у режимі розробки

Backend (у папці `backend/`):
```bash
npm run dev
```

Frontend (у папці `frontend/`):
```bash
npm run dev
```

Для зручності можна запустити обидва сервіси одразу одним скриптом:

- Linux: `bash docs/scripts/dev.sh`
- Windows: `docs\scripts\dev.bat`

Frontend буде доступний за адресою: http://localhost:5173  
Backend API: http://localhost:5000