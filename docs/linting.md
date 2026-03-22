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