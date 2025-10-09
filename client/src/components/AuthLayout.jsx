import { darkTheme as t } from './ui/theme';

export default function AuthLayout({ children }) {
  return (
    <div style={{ background: t.bg, color: t.text900 }}>
      {children}
    </div>
  );
}
