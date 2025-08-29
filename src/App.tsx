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

  // OAuth 콜백 처리 및 URL 정리
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // OAuth 해시가 있는 경우 Supabase에서 세션 설정
      if (window.location.hash && window.location.hash.includes('access_token')) {
        console.log('🔑 OAuth 콜백 감지:', window.location.hash.substring(0, 50) + '...')
        
        try {
          // Supabase Auth 상태 변경을 수동으로 트리거하여 해시 처리
          console.log('🔄 Supabase 세션 새로고침 시작...')
          
          // 현재 세션 확인
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
          console.log('📊 현재 세션 상태:', sessionData.session ? '✅ 있음' : '❌ 없음')
          
          if (!sessionData.session && !sessionError) {
            // 세션이 없다면 해시에서 수동 파싱 시도
            console.log('🔧 해시에서 수동 세션 복원 시도...')
            
            // Supabase가 해시를 자동으로 처리하도록 강제
            const { error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.error('세션 새로고침 오류:', refreshError)
            }
            
            // 추가로 getUser로 현재 사용자 확인
            const { data: userData, error: userError } = await supabase.auth.getUser()
            if (userData.user && !userError) {
              console.log('✅ 사용자 확인 성공:', userData.user.email)
            }
          }
          
          // 최종 세션 상태 확인
          const { data: finalData } = await supabase.auth.getSession()
          if (finalData.session) {
            console.log('✅ OAuth 세션 설정 최종 성공:', finalData.session.user.email)
          } else {
            console.log('⚠️ 세션 설정이 완료되지 않음 - AuthStore에서 처리될 예정')
          }
        } catch (error) {
          console.error('OAuth 콜백 처리 오류:', error)
        }
        
        // 약간의 지연 후 URL 정리 (Supabase 처리 완료 대기)
        setTimeout(() => {
          console.log('🧹 OAuth 콜백 후 URL 정리')
          window.history.replaceState({}, document.title, window.location.pathname)
          console.log('✨ 깔끔한 URL로 변경 완료!')
        }, 1000)
      } else if (window.location.search) {
        // 일반적인 쿼리 파라미터 정리
        console.log('🧹 쿼리 파라미터 정리')
        window.history.replaceState({}, document.title, window.location.pathname)
        console.log('✨ URL 정리 완료!')
      }
    }

    // OAuth 콜백 처리 실행
    handleOAuthCallback()
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
