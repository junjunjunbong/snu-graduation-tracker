import { useAuthStore } from '../stores/authStore'
import { useCreditStore } from '../stores/creditStore'

export function SyncStatus() {
  const { isAuthenticated } = useAuthStore()
  const { isLoading } = useCreditStore()

  if (!isAuthenticated) {
    return (
      <div className="text-center py-3 px-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700 text-sm">
          💾 로컬 저장 모드 • 구글 로그인하면 클라우드 저장과 멀티디바이스 동기화가 가능합니다
        </p>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="flex items-center justify-start text-xs">
        {/* 왼쪽: 상태 표시 */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          {isLoading && (
            <>
              <div className="w-3 h-3 border border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-green-600">동기화 중...</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
