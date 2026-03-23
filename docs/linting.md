# Linting

## Обраний лінтер

Для проєкту обрано **ESLint** - стандарт для JavaScript/React екосистеми.

Причини вибору:
- Стандарт для JavaScript/React екосистеми
- Підтримує JSX для React компонентів
- Розширюється плагінами (react-hooks, react-refresh)
- Вже інтегрований у Vite проекти

## Базові правила

**Frontend:**
- `no-unused-vars` - помилка якщо змінна оголошена але не використовується
- `no-console` - попередження для console.log (дозволено console.error та console.warn)
- `react-hooks/set-state-in-effect` - попередження про виклик setState в useEffect
- `react-refresh/only-export-components` - файл має експортувати тільки компоненти

**Backend:**
- `no-unused-vars` - помилка якщо змінна або аргумент не використовується (аргументи з `_` ігноруються)
- `no-console` - попередження для console.log (дозволено console.error та console.warn)

## Запуск лінтера

**Frontend:**
```bash
cd frontend
npx eslint .
```

**Backend:**
```bash
cd backend
npx eslint .
```

## Git hooks

Pre-commit хуки налаштовані через husky. При кожному `git commit` автоматично запускається лінтер для frontend і backend. Якщо є помилки - коміт блокується.

Конфігурація знаходиться у файлі `.husky/pre-commit`.

## Інтеграція з процесом збірки

В обох частинах проекту додано скрипти в `package.json`:

- `npm run lint` - запуск лінтера
- `npm run type-check` - запуск TypeScript перевірки
- `npm run check` - запуск лінтера і TypeScript перевірки разом

## Статична перевірка типів

Для перевірки типів використовується TypeScript з `checkJs: true` - це дозволяє перевіряти звичайні `.js` файли без переписування коду на TypeScript.

Конфігурація знаходиться у файлах `frontend/tsconfig.json` та `backend/tsconfig.json`.

Для комплексної перевірки коду з кореня проекту:

**Linux/Mac:**
```bash
bash docs/scripts/check.sh
```

**Windows:**
```bat
docs\scripts\check.bat
```