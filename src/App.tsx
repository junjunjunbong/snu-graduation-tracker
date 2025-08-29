import { useCreditStore, useProfileStore } from './stores/creditStore'
import RequirementCards from './components/RequirementCards'
import SemesterGrid from './components/SemesterGrid'
import Header from './components/Header'
import { SyncStatus } from './components/SyncStatus'

function App() {
  const { requirements } = useCreditStore()
  const { dualMajorEnabled, toggleDualMajor } = useProfileStore()

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '1rem' }}>
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
