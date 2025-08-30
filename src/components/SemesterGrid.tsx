import { useState } from 'react'
import { useCreditStore } from '../stores/creditStore'
import type { SemesterType, BucketType, MajorType } from '../types'
import { BUCKET_LABELS, MAJOR_LABELS, getSemesterLabel } from '../types'

const BUCKETS: BucketType[] = ['MR', 'ME', 'LB', 'EC', 'OMR', 'OME']
const MAJORS: MajorType[] = ['MAJOR', 'DUAL']

function CreditInput({ semester }: { semester: SemesterType }) {
  const { addTransaction } = useCreditStore()
  const [bucket, setBucket] = useState<BucketType>('ME')
  const [major, setMajor] = useState<MajorType>('MAJOR')
  const [credits, setCredits] = useState('3')
  const [courseName, setCourseName] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const creditValue = parseFloat(credits)
    if (isNaN(creditValue) || creditValue <= 0) {
      alert('올바른 학점을 입력해주세요.')
      return
    }
    
    // 전공필수/전공선택/복수전공필수/복수전공선택인 경우만 major를 전달
    const majorToPass = (bucket === 'MR' || bucket === 'ME' || bucket === 'OMR' || bucket === 'OME') ? major : undefined
    
    try {
      const success = await addTransaction(semester, bucket, creditValue, courseName.trim() || undefined, majorToPass)
      if (success) {
        setCredits('3')
        setCourseName('')
        setIsAdding(false)
      } else {
        alert('학점 입력에 실패했습니다. (0.5 단위로 입력해주세요)')
      }
    } catch (error) {
      console.error('학점 추가 실패:', error)
      alert('학점 입력 중 오류가 발생했습니다.')
    }
  }
  
  if (!isAdding) {
    return (
      <button 
        onClick={() => setIsAdding(true)}
        style={{ 
          background: 'transparent',
          border: '2px dashed #d1d5db',
          color: '#6b7280',
          padding: '1rem',
          borderRadius: '8px',
          width: '100%',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6'
          e.currentTarget.style.color = '#3b82f6'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#d1d5db'
          e.currentTarget.style.color = '#6b7280'
        }}
      >
        + 학점 추가
      </button>
    )
  }
  
  return (
    <form onSubmit={handleSubmit} style={{ 
      border: '2px solid #3b82f6', 
      padding: '1rem', 
      borderRadius: '8px', 
      background: 'white' 
    }}>
      <div style={{ marginBottom: '0.5rem' }}>
        {/* 버킷 선택 */}
        <select
          value={bucket}
          onChange={(e) => setBucket(e.target.value as BucketType)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        >
          {BUCKETS.map(b => (
            <option key={b} value={b}>{BUCKET_LABELS[b]}</option>
          ))}
        </select>
        
        {/* 전공관련 버킷인 경우 주전공 선택 */}
        {(bucket === 'MR' || bucket === 'ME' || bucket === 'OMR' || bucket === 'OME') && (
          <select
            value={major}
            onChange={(e) => setMajor(e.target.value as MajorType)}
            style={{ width: '100%', marginBottom: '0.5rem' }}
          >
            {MAJORS.map(m => (
              <option key={m} value={m}>{MAJOR_LABELS[m]}</option>
            ))}
          </select>
        )}
        
        {/* 과목명 입력 */}
        <input
          type="text"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="과목명 (선택사항)"
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        
        {/* 학점 입력 */}
        <input
          type="number"
          step="0.5"
          min="0"
          max="30"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
          placeholder="학점"
          style={{ width: '100%', marginBottom: '0.5rem' }}
          autoFocus
        />
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          type="submit"
          style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
        >
          추가
        </button>
        <button 
          type="button"
          onClick={() => setIsAdding(false)}
          style={{ 
            flex: 1, 
            fontSize: '0.8rem', 
            padding: '0.5rem',
            background: '#6b7280',
            color: 'white'
          }}
        >
          취소
        </button>
      </div>
    </form>
  )
}

function SemesterColumn({ semester }: { semester: SemesterType }) {
  const { transactions, removeTransaction } = useCreditStore()
  
  const semesterTransactions = transactions.filter(t => t.term === semester)
  const totalCredits = semesterTransactions.reduce((sum, t) => sum + t.credits, 0)
  
  return (
    <div className="card">
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
          {getSemesterLabel(semester)}
        </h3>
        {totalCredits > 0 && (
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            총 {totalCredits}학점
          </span>
        )}
      </div>
      
      {/* 기존 거래 목록 */}
      <div style={{ marginBottom: '1rem' }}>
        {semesterTransactions.map(txn => (
          <div 
            key={txn.id}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.5rem',
              backgroundColor: '#f9fafb',
              borderRadius: '4px',
              marginBottom: '0.25rem'
            }}
          >
            <div style={{ fontSize: '0.8rem', flex: 1 }}>
              <div style={{ fontWeight: '500' }}>
                {BUCKET_LABELS[txn.bucket]}
                {txn.major && ` (${MAJOR_LABELS[txn.major]})`}
              </div>
              {txn.courseName && (
                <div style={{ color: '#374151', fontSize: '0.75rem' }}>{txn.courseName}</div>
              )}
              <div style={{ color: '#6b7280' }}>{txn.credits}학점</div>
            </div>
            <button
              onClick={async () => {
                try {
                  await removeTransaction(txn.id)
                } catch (error) {
                  console.error('학점 삭제 실패:', error)
                  alert('학점 삭제 중 오류가 발생했습니다.')
                }
              }}
              style={{ 
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.25rem 0.5rem',
                fontSize: '0.7rem'
              }}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
      
      {/* 입력 폼 */}
      <CreditInput semester={semester} />
    </div>
  )
}

function AddSemesterForm() {
  const { addSemester } = useCreditStore()
  const [newSemester, setNewSemester] = useState('')
  const [showForm, setShowForm] = useState(false)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newSemester.trim()) {
      alert('학기를 입력해주세요.')
      return
    }
    
    // 학기 형식 검증 (예: 1-1, 2-2, 5-1 등)
    if (!/^\d+-[12]$/.test(newSemester.trim())) {
      alert('학기 형식이 올바르지 않습니다. (예: 1-1, 2-2, 5-1)')
      return
    }
    
    const success = addSemester(newSemester.trim())
    if (success) {
      setNewSemester('')
      setShowForm(false)
    } else {
      alert('이미 존재하는 학기입니다.')
    }
  }
  
  if (!showForm) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
        <button 
          onClick={() => setShowForm(true)}
          style={{ 
            background: 'transparent',
            border: '2px dashed #d1d5db',
            color: '#6b7280',
            padding: '1rem 2rem',
            borderRadius: '8px',
            fontSize: '1rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6'
            e.currentTarget.style.color = '#3b82f6'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d1d5db'
            e.currentTarget.style.color = '#6b7280'
          }}
        >
          + 학기 추가
        </button>
      </div>
    )
  }
  
  return (
    <div className="card">
      <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>새 학기 추가</h3>
        <input
          type="text"
          value={newSemester}
          onChange={(e) => setNewSemester(e.target.value)}
          placeholder="학기 (예: 5-1, 6-2)"
          style={{ width: '100%', marginBottom: '1rem' }}
          autoFocus
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" style={{ flex: 1, fontSize: '0.9rem', padding: '0.5rem' }}>
            추가
          </button>
          <button 
            type="button"
            onClick={() => {
              setShowForm(false)
              setNewSemester('')
            }}
            style={{ 
              flex: 1, 
              fontSize: '0.9rem', 
              padding: '0.5rem',
              background: '#6b7280',
              color: 'white'
            }}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}

function SemesterGrid() {
  const { semesters, removeSemester } = useCreditStore()
  
  const handleRemoveSemester = (semester: SemesterType) => {
    if (confirm(`${getSemesterLabel(semester)}을(를) 삭제하시겠습니까?`)) {
      const success = removeSemester(semester)
      if (!success) {
        alert('해당 학기에 등록된 과목이 있어서 삭제할 수 없습니다.')
      }
    }
  }
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>학기별 학점 입력</h2>
        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          학기를 추가하려면 맨 오른쪽의 "+" 버튼을 클릭하세요
        </div>
      </div>
      
      <div className="grid" style={{ 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '1rem',
        maxWidth: '100%'
      }}>
        {semesters
          .sort((a, b) => {
            // 학기 순서로 정렬 (1-1, 1-2, 2-1, 2-2, ...)
            const [aYear, aTerm] = a.split('-').map(Number)
            const [bYear, bTerm] = b.split('-').map(Number)
            if (aYear !== bYear) return aYear - bYear
            return aTerm - bTerm
          })
          .map(semester => (
            <div key={semester} style={{ position: 'relative' }}>
              <SemesterColumn semester={semester} />
              {!['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'].includes(semester) && (
                <button
                  onClick={() => handleRemoveSemester(semester)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={`${getSemesterLabel(semester)} 삭제`}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        <AddSemesterForm />
      </div>
    </div>
  )
}

export default SemesterGrid