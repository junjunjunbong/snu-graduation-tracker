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
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        <span>로딩중...</span>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        {/* 사용자 프로필 */}
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name || user.email} 
              className="w-6 h-6 rounded-full"
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-green-800">
              {user.name || user.email}
            </span>
            <span className="text-xs text-green-600">로그인됨</span>
          </div>
        </div>

        {/* 동기화 버튼 */}
        <button
          onClick={handleSyncData}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          title="로컬 데이터를 클라우드에 동기화"
        >
          동기화
        </button>

        {/* 로그아웃 버튼 */}
        <button
          onClick={signOut}
          className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
        >
          로그아웃
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <span className="text-sm text-red-600">{error}</span>
          <button
            onClick={clearError}
            className="text-red-400 hover:text-red-600 text-xs"
          >
            ×
          </button>
        </div>
      )}

      {/* 구글 로그인 버튼 */}
      <button
        onClick={handleSignIn}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
      >
        {/* 구글 로고 SVG */}
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span className="text-sm font-medium text-gray-700">
          구글로 로그인
        </span>
      </button>

      {/* 로그인 안내 */}
      <div className="text-xs text-gray-500 max-w-40">
        로그인하면 데이터를 클라우드에 저장하고 다른 기기에서도 사용할 수 있습니다
      </div>
    </div>
  )
}