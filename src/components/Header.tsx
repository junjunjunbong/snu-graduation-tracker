import { AuthButton } from './AuthButton'

function Header() {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}></div>
        
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            🎓 SNU 졸업요건 추적
          </h1>
        </div>
        
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <AuthButton />
        </div>
      </div>
      
      <p style={{ color: '#6b7280', fontSize: '1rem' }}>
        졸업요건을 간단히 추적해보세요
      </p>
    </div>
  )
}

export default Header