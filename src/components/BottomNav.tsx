import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', glyph: '◆', label: 'Home', end: true },
  { to: '/walk/checklist', glyph: '✓', label: 'Checklist' },
  { to: '/walk/measures', glyph: '◇', label: 'Measures' },
  { to: '/walk/utilities', glyph: '●', label: 'Utilities' },
  { to: '/walk/docs', glyph: '▸', label: 'Docs' },
  { to: '/walk/signoff', glyph: '→', label: 'Sign-Off' }
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => (isActive ? 'is-active' : '')}>
          <span className="glyph">{tab.glyph}</span>
          <span className="tab-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
