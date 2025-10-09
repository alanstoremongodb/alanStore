import { darkTheme as t } from './theme';

export default function Card({ className = '', style, children, bodyClassName = 'card-body', bodyStyle }) {
  return (
    <div
      className={`b-card h-100 border-0 ${className}`}
      style={{
        borderRadius: t.radius,
        background: t.surface,
        border: t.border,
        boxShadow: t.cardRaiseSm,
        ...style,
      }}
    >
      <div className={bodyClassName} style={{ padding: '12px 16px', ...bodyStyle }}>
        {children}
      </div>
    </div>
  );
}
