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

  // OAuth 콜백 처리 - Supabase v2 자동 처리 방식
  useEffect(() => {
    async function handleAuthRedirect() {
      console.log('🔍 OAuth 콜백 처리 시작...')
      
      // OAuth 해시가 있는 경우만 처리
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('🔑 OAuth 해시 감지 - Supabase 자동 처리 대기 중...')
        
        try {
          // Supabase v2는 자동으로 URL 해시를 처리하므로 약간 대기 후 세션 확인
          await new Promise(resolve => setTimeout(resolve, 100))
          
          const { data: sessionData, error } = await supabase.auth.getSession()
          if (error) {
            console.error('🚨 세션 확인 오류:', error)
          } else if (sessionData.session) {
            console.log('✅ OAuth 세션 확인 성공:', sessionData.session.user.email)
            console.log('📊 세션 정보:', {
              user: sessionData.session.user.email,
              expires: sessionData.session.expires_at 
                ? new Date(sessionData.session.expires_at * 1000).toLocaleString()
                : 'N/A'
            })
          } else {
            console.log('⚠️ 세션이 아직 설정되지 않음 - AuthStore에서 처리될 예정')
          }
        } catch (error) {
          console.error('🚨 세션 확인 실패:', error)
        }
        
        // OAuth 처리 완료 후 URL 정리
        setTimeout(() => {
          console.log('🧹 OAuth 완료 후 URL 정리...')
          window.history.replaceState({}, document.title, window.location.pathname)
          console.log('✨ 깔끔한 URL 완성!')
        }, 1000)
      } else if (window.location.search) {
        // 일반 쿼리 파라미터만 즉시 정리
        console.log('🧹 쿼리 파라미터 정리...')
        window.history.replaceState({}, document.title, window.location.pathname)
        console.log('✨ URL 정리 완료!')
      }
    }

    // OAuth 리디렉션 처리 실행
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
