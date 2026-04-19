/**
 * Варіанти прийомів їжі, доступні в щоденнику харчування.
 */
const MEALS = [
  { id: 'breakfast', label: 'Сніданок' },
  { id: 'lunch', label: 'Обід' },
  { id: 'dinner', label: 'Вечеря' },
  { id: 'snack', label: 'Перекус' },
]

const COLS = '1fr 44px 44px 44px 44px 60px 24px'

const cellStyle = (align = 'right') => ({
  padding: '7px 8px',
  fontSize: 12,
  textAlign: align,
  color: 'var(--text-secondary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

export default function FoodTable({ logs, onAdd, onDelete }) {
  return (
    <div style={{ border: '1px solid var(--border)', minWidth: 0 }}>
      {/* Заголовок таблиці */}
      <div style={{
        display: 'grid', gridTemplateColumns: COLS,
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)'
      }}>
        {['Продукт', 'г', 'Б', 'Ж', 'В', 'Ккал', ''].map((h, i) => (
          <div key={i} style={{
            padding: '6px 8px', fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            color: 'var(--text-muted)',
            textAlign: i === 0 ? 'left' : 'right',
            paddingLeft: i === 0 ? 12 : 8
          }}>
            {h}
          </div>
        ))}
      </div>

      {/* Прийоми їжі */}
      {MEALS.map(meal => {
        const items = logs.filter(l => l.meal_type === meal.id)
        const mTotal = Math.round(items.reduce((s, i) => s + (+i.kcal || 0), 0))

        return (
          <div key={meal.id} style={{ borderBottom: '1px solid var(--border)' }}>
            {/* Рядок прийому їжі */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', background: 'var(--bg-secondary)',
              borderBottom: items.length ? '1px solid var(--border-light)' : 'none'
            }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{meal.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 10 }}>
                {mTotal} ккал
              </span>
              <button
                onClick={() => onAdd(meal.id)}
                style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                + додати
              </button>
            </div>

            {/* Порожній стан */}
            {items.length === 0 && (
              <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text-faint)' }}>
                Немає записів
              </div>
            )}

            {/* Записи про їжу */}
            {items.map(item => (
              <div key={item.id} style={{ display: 'grid', gridTemplateColumns: COLS, borderTop: '1px solid var(--border-light)' }}>
                <div style={{ ...cellStyle('left'), paddingLeft: 12, color: 'var(--text)' }}>
                  {item.food_name}
                </div>
                <div style={cellStyle()}>{Math.round(item.amount_g)}</div>
                <div style={cellStyle()}>{Math.round(item.protein_g)}</div>
                <div style={cellStyle()}>{Math.round(item.fat_g)}</div>
                <div style={cellStyle()}>{Math.round(item.carbs_g)}</div>
                <div style={{ ...cellStyle(), color: 'var(--accent)', fontWeight: 500 }}>
                  {Math.round(item.kcal)}
                </div>
                <div
                  onClick={() => onDelete(item.id)}
                  title="Видалити"
                  style={{ ...cellStyle('center'), color: 'var(--text-faint)', cursor: 'pointer' }}
                >
                  ×
                </div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}