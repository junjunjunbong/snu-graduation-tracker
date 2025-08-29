import { AuthButton } from './AuthButton'

function Header() {
  return (
    <header 
      className="card" 
      style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(1rem, 3vw, 1.5rem) clamp(1rem, 4vw, 2rem)',
        minHeight: 'auto',
        maxHeight: '15vh'
      }}
    >
      {/* 왼쪽 제목 영역 */}
      <div style={{ flex: '1' }}>
        <h1 style={{ 
          fontSize: 'clamp(1.25rem, 3.5vw, 1.75rem)',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0',
          letterSpacing: '-0.02em',
          lineHeight: 1.2
        }}>
          🎓 SNU 졸업요건 추적
        </h1>
        
        <p style={{ 
          color: '#64748b', 
          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
          fontWeight: '400',
          lineHeight: '1.4',
          margin: '0.25rem 0 0 0'
        }}>
          졸업요건을 간단히 추적해보세요
        </p>
      </div>

      {/* 오른쪽 로그인 버튼 */}
      <div style={{ 
        flexShrink: 0,
        marginLeft: 'clamp(1rem, 3vw, 2rem)'
      }}>
        <AuthButton />
      </div>
    </header>
  )
}

export default Header