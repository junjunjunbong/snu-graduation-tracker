import { useEffect } from 'react'
import { useCreditStore, useProfileStore } from './stores/creditStore'
import RequirementCards from './components/RequirementCards'
import SemesterGrid from './components/SemesterGrid'
import Header from './components/Header'
import { SyncStatus } from './components/SyncStatus'
import { BrowserGuide } from './components/BrowserGuide'

function App() {
  const { requirements } = useCreditStore()
  const { dualMajorEnabled, toggleDualMajor } = useProfileStore()

  // 앱 로드 시 즉시 URL 토큰 정리
  useEffect(() => {
    const cleanUpUrl = () => {
      if (window.location.hash && (
        window.location.hash.includes('access_token') || 
        window.location.hash.includes('refresh_token') ||
        window.location.hash.includes('provider_token') ||
        window.location.hash.includes('expires_at')
      )) {
        console.log('🧹 앱 로드 시 URL 정리 실행...')
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search)
        console.log('✨ 깔끔한 URL로 변경 완료!')
      }
    }

    // 즉시 실행
    cleanUpUrl()
    
    // 약간의 지연 후에도 한 번 더 실행 (Supabase 처리 후)
    setTimeout(cleanUpUrl, 500)
    setTimeout(cleanUpUrl, 1000)
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '1rem' }}>
      {/* 브라우저 가이드 팝업 */}
      <BrowserGuide />
      
      {/* 헤더 */}
      <Header />
      
      {/* 동기화 상태 */}
      <div style={{ maxWidth: '1200px', margin: '1rem auto 0' }}>
        <SyncStatus />
      </div>
      
      {/* 메인 컨테이너 */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        display: 'grid', 
        gridTemplateColumns: '300px 1fr', 
        gap: '2rem',
        marginTop: '2rem'
      }}>
        {/* 왼쪽: 요건 카드 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <RequirementCards requirements={requirements} />
          
          {/* 복수전공 토글 */}
          <div className="card">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={dualMajorEnabled}
                onChange={toggleDualMajor}
                style={{ transform: 'scale(1.2)' }}
              />
              <span>복수전공 활성화</span>
            </label>
          </div>
        </div>
        
        {/* 오른쪽: 학기별 입력 */}
        <SemesterGrid />
      </div>
    </div>
  )
}

export default App
