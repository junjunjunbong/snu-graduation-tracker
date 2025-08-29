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

  // 디버깅용 로그
  console.log('🔍 AuthButton 상태:', {
    isAuthenticated,
    user: user?.email,
    isLoading,
    error
  })

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
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-white text-xs rounded-lg" style={{
        background: 'rgba(59, 130, 246, 0.2)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.1)'
      }}>
        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span className="font-medium hidden sm:inline">로그인 중</span>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        {/* 사용자 프로필 - 컴팩트 */}
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg shadow-sm px-2 py-1.5">
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name || user.email} 
              className="rounded-full border"
              style={{ width: '20px', height: '20px' }}
            />
          )}
          <span className="font-medium text-gray-700 truncate text-sm" style={{ 
            maxWidth: '80px'
          }}>
            {user.name || user.email.split('@')[0]}
          </span>
        </div>

        {/* 동기화 버튼 - 작게 */}
        <button
          onClick={handleSyncData}
          className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-2 py-1.5 rounded-lg transition-colors duration-200 text-xs font-medium shadow-sm"
          title="클라우드 동기화"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>

        {/* 로그아웃 버튼 - 작게 */}
        <button
          onClick={signOut}
          className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-2 py-1.5 rounded-lg transition-colors duration-200 text-xs font-medium shadow-sm"
          title="로그아웃"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
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

      {/* 작은 로그인 버튼 */}
      <button
        onClick={handleSignIn}
        className="flex items-center bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300 hover:shadow-md"
        style={{ 
          padding: '0.5rem 0.75rem', 
          gap: '0.5rem',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          fontSize: '0.875rem'
        }}
      >
        {/* 작은 Google 아이콘 */}
        <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>로그인</span>
      </button>
    </div>
  )
}