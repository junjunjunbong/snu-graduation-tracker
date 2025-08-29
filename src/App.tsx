import { useEffect } from 'react'
import { useCreditStore, useProfileStore } from './stores/creditStore'
import { supabase } from './lib/supabase'
import RequirementCards from './components/RequirementCards'
import SemesterGrid from './components/SemesterGrid'
import Header from './components/Header'
import { SyncStatus } from './components/SyncStatus'
import { BrowserGuide } from './components/BrowserGuide'

function App() {
  const { requirements } = useCreditStore()
  const { dualMajorEnabled, toggleDualMajor } = useProfileStore()

  // OAuth 콜백 처리 - Supabase v2 방식
  useEffect(() => {
    async function handleAuthRedirect() {
      try {
        console.log('🔍 OAuth 콜백 처리 시작...')
        
        // Supabase v2: getSessionFromUrl로 해시에서 세션 추출 및 저장
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true })
        
        if (error) {
          console.error('🚨 getSessionFromUrl 오류:', error)
        } else if (data?.session) {
          console.log('✅ OAuth 세션 설정 성공:', data.session.user.email)
          console.log('📊 세션 정보:', {
            user: data.session.user.email,
            expires: new Date(data.session.expires_at * 1000).toLocaleString()
          })
        } else {
          console.log('ℹ️ OAuth 해시가 없거나 세션 생성되지 않음')
        }
        
      } catch (error) {
        console.error('🚨 OAuth 콜백 처리 실패:', error)
      } finally {
        // 세션 처리 완료 후 URL 정리 (성공/실패 무관하게)
        if (window.location.hash || window.location.search) {
          console.log('🧹 URL 정리 실행...')
          window.history.replaceState({}, document.title, window.location.pathname)
          console.log('✨ 깔끔한 URL 완성!')
        }
      }
    }

    // OAuth 리디렉션 처리 - 앱 로드 시 한 번만 실행
    handleAuthRedirect()
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
