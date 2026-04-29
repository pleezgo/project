/**
 * Компонент 5-зіркової шкали оцінки.
 * @param {object} props
 * @param {number} props.value Поточне значення (0-5)
 * @param {function} props.onChange Колбек при зміні оцінки
 * @param {boolean} props.readOnly Якщо true — тільки відображення
 * @param {number} props.size Розмір зірки в px (default 18)
 */
export default function StarRating({ value = 0, onChange, readOnly = false, size = 18 }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => !readOnly && onChange && onChange(n === value ? 0 : n)}
          style={{
            fontSize: size,
            color: n <= value ? 'var(--amber)' : 'var(--text-faint)',
            cursor: readOnly ? 'default' : 'pointer',
            userSelect: 'none',
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </div>
  )
}