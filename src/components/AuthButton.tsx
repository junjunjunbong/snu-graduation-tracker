import { useAuthStore } from '../stores/authStore'

export function AuthButton() {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    error, 
    signInWithGoogle, 
    signOut, 
    clearError,
    syncDataToCloud 
  } = useAuthStore()

  const handleSignIn = async () => {
    const success = await signInWithGoogle()
    if (!success && error) {
      console.error('로그인 실패:', error)
    }
  }

  const handleSyncData = async () => {
    if (!isAuthenticated) return
    
    const confirmSync = window.confirm(
      '현재 로컬 데이터를 클라우드에 저장하시겠습니까?\n' +
      '기존 클라우드 데이터는 덮어쓰기됩니다.'
    )
    
    if (confirmSync) {
      const success = await syncDataToCloud()
      if (success) {
        alert('데이터가 성공적으로 동기화되었습니다!')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
        <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-sm font-medium">로그인 중</span>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-1">
        {/* 사용자 프로필 - 미니멀 디자인 */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name || user.email} 
              className="w-6 h-6 rounded-full"
            />
          )}
          <span className="text-sm font-medium text-gray-700 max-w-20 truncate">
            {user.name || user.email.split('@')[0]}
          </span>
        </div>

        {/* 액션 버튼들 - 아이콘만 */}
        <button
          onClick={handleSyncData}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="클라우드 동기화"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={signOut}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="로그아웃"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* 에러 메시지 - 컴팩트 */}
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-center">
          <div className="text-xs text-red-600">{error}</div>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* 구글 로그인 버튼 - 미니멀 */}
      <button
        onClick={handleSignIn}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200 text-gray-700 hover:text-gray-900"
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="text-sm font-medium">로그인</span>
      </button>
    </div>
  )
}