import { AuthButton } from './AuthButton'

function Header() {
  return (
    <div className="card" style={{ position: 'relative', textAlign: 'center', padding: '2rem 1rem' }}>
      {/* 로그인 버튼을 우상단 절대 위치로 배치 */}
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <AuthButton />
      </div>
      
      {/* 중앙 제목 영역 */}
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '0.8rem',
          letterSpacing: '-0.02em'
        }}>
          🎓 SNU 졸업요건 추적
        </h1>
        
        <p style={{ 
          color: '#64748b', 
          fontSize: '1.1rem',
          fontWeight: '400',
          lineHeight: '1.5'
        }}>
          졸업요건을 간단히 추적해보세요
        </p>
      </div>
    </div>
  )
}

export default Header