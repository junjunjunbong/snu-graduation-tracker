import { AuthButton } from './AuthButton'

function Header() {
  return (
    <header 
      className="card" 
      style={{ 
        position: 'relative', 
        textAlign: 'center', 
        padding: 'clamp(1rem, 4vw, 2rem) clamp(0.75rem, 3vw, 1.5rem)',
        minHeight: 'auto',
        maxHeight: '20vh' // 뷰포트 높이의 20%로 제한
      }}
    >
      {/* 로그인 버튼 - 반응형 위치 조정 */}
      <div style={{ 
        position: 'absolute', 
        top: 'clamp(0.5rem, 2vw, 1rem)', 
        right: 'clamp(0.5rem, 2vw, 1rem)',
        zIndex: 10,
        touchAction: 'manipulation' // 모바일 터치 최적화
      }}>
        <AuthButton />
      </div>
      
      {/* 중앙 제목 영역 - 컴팩트 디자인 */}
      <div style={{ 
        maxWidth: 'min(600px, 90vw)', 
        margin: '0 auto',
        paddingRight: 'clamp(3rem, 15vw, 8rem)' // 로그인 버튼 공간 확보
      }}>
        <h1 style={{ 
          fontSize: 'clamp(1.5rem, 4.5vw, 2.5rem)', // 반응형 폰트 크기
          fontWeight: '700',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)', // 여백 최소화
          letterSpacing: '-0.02em',
          lineHeight: 1.2
        }}>
          🎓 SNU 졸업요건 추적
        </h1>
        
        <p style={{ 
          color: '#64748b', 
          fontSize: 'clamp(0.875rem, 2.5vw, 1rem)', // 설명 텍스트 축소
          fontWeight: '400',
          lineHeight: '1.4',
          margin: '0' // 하단 마진 제거
        }}>
          졸업요건을 간단히 추적해보세요
        </p>
      </div>
    </header>
  )
}

export default Header