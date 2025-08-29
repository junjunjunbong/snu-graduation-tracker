import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useCreditStore } from '../stores/creditStore'

export function SyncStatus() {
  const { isAuthenticated, user, syncDataToCloud, syncDataFromCloud } = useAuthStore()
  const { transactions } = useCreditStore()
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  // 자동 동기화 (5분마다)
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(async () => {
      if (transactions.length > 0) {
        setIsSyncing(true)
        const success = await syncDataToCloud()
        if (success) {
          setLastSync(new Date())
        }
        setIsSyncing(false)
      }
    }, 5 * 60 * 1000) // 5분

    return () => clearInterval(interval)
  }, [isAuthenticated, transactions.length, syncDataToCloud])

  const handleManualSync = async () => {
    if (!isAuthenticated) return
    
    setIsSyncing(true)
    try {
      const success = await syncDataToCloud()
      if (success) {
        setLastSync(new Date())
        alert('동기화가 완료되었습니다!')
      } else {
        alert('동기화 중 오류가 발생했습니다.')
      }
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDownloadData = async () => {
    if (!isAuthenticated) return
    
    const confirmDownload = window.confirm(
      '📥 클라우드에서 데이터를 다운로드하시겠습니까?\n\n' +
      '⚠️ 주의: 현재 로컬 데이터가 클라우드 데이터로 완전히 대체됩니다.\n' +
      '이 작업은 되돌릴 수 없습니다.\n\n' +
      '계속 진행하시겠습니까?'
    )
    
    if (!confirmDownload) return
    
    setIsSyncing(true)
    try {
      const success = await syncDataFromCloud()
      if (success) {
        alert('데이터를 성공적으로 불러왔습니다!')
      } else {
        alert('데이터 불러오기 중 오류가 발생했습니다.')
      }
    } finally {
      setIsSyncing(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="text-center py-3 px-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm">
          💾 로컬 저장 모드 • 구글 로그인하면 클라우드 백업과 멀티디바이스 동기화가 가능합니다
        </p>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">
              클라우드 동기화
            </span>
          </div>
          
          {lastSync && (
            <span className="text-xs text-green-600">
              {lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* 수동 동기화 버튼 */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing || transactions.length === 0}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs rounded transition-colors"
            title={isSyncing ? "동기화 중..." : "클라우드에 업로드"}
          >
            {isSyncing ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span>업로드 중</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span>업로드</span>
              </>
            )}
          </button>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleDownloadData}
            disabled={isSyncing}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs rounded transition-colors"
            title="클라우드에서 다운로드"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            <span>다운로드</span>
          </button>
        </div>
      </div>

      <div className="mt-2 text-xs text-green-600">
        {user?.email} • 자동 백업 • {transactions.length}개 항목
      </div>
    </div>
  )
}