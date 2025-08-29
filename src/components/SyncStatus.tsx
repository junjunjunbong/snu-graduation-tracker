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
      '클라우드에서 데이터를 다운로드하시겠습니까?\n' +
      '현재 로컬 데이터는 덮어쓰기됩니다.'
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
      <div className="text-center py-4 px-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">
          📱 현재 로컬 모드로 사용중입니다. 
          <br />
          구글 로그인하면 데이터를 클라우드에 저장하고 다른 기기에서도 사용할 수 있습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-800">
              클라우드 동기화 활성화
            </span>
          </div>
          
          {lastSync && (
            <span className="text-xs text-green-600">
              마지막 동기화: {lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 수동 동기화 버튼 */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing || transactions.length === 0}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs rounded transition-colors"
          >
            {isSyncing ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                동기화중
              </>
            ) : (
              <>
                ☁️ 업로드
              </>
            )}
          </button>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleDownloadData}
            disabled={isSyncing}
            className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white text-xs rounded transition-colors"
          >
            📥 다운로드
          </button>
        </div>
      </div>

      <div className="mt-2 text-xs text-green-600">
        {user?.email}로 로그인됨 • 
        데이터가 자동으로 클라우드에 백업됩니다 • 
        로컬 변경사항: {transactions.length}개
      </div>
    </div>
  )
}