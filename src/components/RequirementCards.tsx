import type { RequirementStatus } from '../types'
import { useCreditStore } from '../stores/creditStore'

interface RequirementCardsProps {
  requirements: RequirementStatus[]
}

function RequirementCard({ requirement }: { requirement: RequirementStatus }) {
  const { bucket, current, required, remaining, isComplete, percentage } = requirement
  const { totals } = useCreditStore()
  
  return (
    <div className="card">
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{bucket}</h3>
          <span style={{ 
            fontSize: '0.9rem', 
            color: isComplete ? '#059669' : '#dc2626',
            fontWeight: '500'
          }}>
            {current}/{required}
          </span>
        </div>
        
        {/* 전공인 경우 세부 정보 표시 */}
        {bucket === '전공' && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '6px',
            fontSize: '0.8rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ color: '#6b7280' }}>전공필수</span>
              <span style={{ color: '#374151' }}>{totals.majorRequiredTotal}학점</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>전공선택</span>
              <span style={{ color: '#374151' }}>{totals.majorElectiveTotal}학점</span>
            </div>
          </div>
        )}

        {/* 복수전공인 경우 세부 정보 표시 */}
        {bucket === '복수전공' && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem', 
            backgroundColor: '#f9fafb', 
            borderRadius: '6px',
            fontSize: '0.8rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ color: '#6b7280' }}>복수전공필수</span>
              <span style={{ color: '#374151' }}>{totals.dualMajorRequiredTotal}학점</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280' }}>복수전공선택</span>
              <span style={{ color: '#374151' }}>{totals.dualMajorElectiveTotal}학점</span>
            </div>
          </div>
        )}
        
        {/* 진행바 */}
        <div className="progress-bar" style={{ margin: '0.5rem 0' }}>
          <div 
            className="progress-fill" 
            style={{ 
              width: `${Math.min(percentage, 100)}%`,
              background: isComplete 
                ? 'linear-gradient(90deg, #10b981, #059669)' 
                : 'linear-gradient(90deg, #f59e0b, #d97706)'
            }}
          />
        </div>
        
        {/* 상태 정보 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span style={{ color: '#6b7280' }}>
            {isComplete ? '✅ 완료' : `${remaining}학점 부족`}
          </span>
          <span style={{ color: '#6b7280' }}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  )
}

function RequirementCards({ requirements }: RequirementCardsProps) {
  return (
    <>
      {requirements.map((req, index) => (
        <RequirementCard key={index} requirement={req} />
      ))}
    </>
  )
}

export default RequirementCards