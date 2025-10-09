import { FiSearch } from 'react-icons/fi';
import { darkTheme as t } from './theme';

export default function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = 'Buscar...',
  className = '',
  inputProps = {},
  icon = <FiSearch size={18} aria-hidden className="search-icon" />,
}) {
  return (
    <div className={`head-search ${className}`} style={{ width: '100%', minWidth: 0 }}>
      <div
        className="search-box"
        style={{
          position: 'relative', display: 'flex', alignItems: 'center',
          background: t.surface2, borderRadius: 12, border: t.border, boxShadow: t.shadowSm,
        }}
      >
        <span style={{ position: 'absolute', left: 12, color: t.text600 }}>{icon}</span>
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          style={{ width: '100%', border: 0, outline: 'none', background: 'transparent', padding: '12px 14px 12px 38px', borderRadius: 12, color: t.text900 }}
          {...inputProps}
        />
        {value && (
          <button
            type="button"
            className="clear-btn"
            aria-label="Limpiar búsqueda"
            onClick={() => onClear?.()}
            style={{ position: 'absolute', right: 36, top: '50%', transform: 'translateY(-50%)', border: 0, background: 'transparent', color: t.text600, width: 28, height: 28, borderRadius: '50%' }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
