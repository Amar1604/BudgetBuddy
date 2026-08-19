export function RupeeBagIcon({ size = 24, className, style }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <path 
        d="M19 13C19 17.4183 15.866 21 12 21C8.13401 21 5 17.4183 5 13C5 10.3705 6.11303 8.07386 8 7V6C8 4.89543 8.89543 4 10 4H14C15.1046 4 16 4.89543 16 6V7C17.887 8.07386 19 10.3705 19 13Z" 
        fill="#ffb020" 
        stroke="#d97706" 
        strokeWidth="1.5" 
        strokeLinejoin="round" 
      />
      <path 
        d="M8 7C10 7.5 14 7.5 16 7" 
        stroke="#b45309" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      <path 
        d="M9.5 10H14.5M9.5 11.8H13.5M9.5 10C12 10 13 11 13 12C13 13 12 13.6 9.5 13.6H11M10.5 13.6L13.5 17" 
        stroke="#451a03" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}

export function BrandLogo({ size = 24, fontSize = 20, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize, fontWeight: 700, ...style }}>
      <RupeeBagIcon size={size} />
      <span style={{
        background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>BudgetBuddy</span>
    </div>
  );
}
