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
      <div className="flex items-center gap-3 px-6 py-3 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-xl" style={{ minWidth: '200px' }}>
        <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="flex flex-col text-left">
          <span className="text-base font-semibold">로그인 중...</span>
          <span className="text-sm text-blue-600">구글 인증 처리중</span>
        </div>
      </div>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        {/* 사용자 프로필 - 개선된 디자인 */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
          {user.picture && (
            <img 
              src={user.picture} 
              alt={user.name || user.email} 
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            />
          )}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800">
              {user.name || user.email.split('@')[0]}
            </span>
            <span className="text-xs text-green-600 flex items-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              로그인됨
            </span>
          </div>
        </div>

        {/* 액션 버튼들 */}
        <div className="flex items-center gap-2">
          {/* 동기화 버튼 */}
          <button
            onClick={handleSyncData}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all duration-200 hover:shadow-md"
            title="로컬 데이터를 클라우드에 동기화"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            동기화
          </button>

          {/* 로그아웃 버튼 */}
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-all duration-200 hover:shadow-md border border-gray-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            로그아웃
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {/* 에러 메시지 */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border-2 border-red-200 rounded-xl max-w-80">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-grow">
            <div className="text-sm font-medium text-red-800">로그인 오류</div>
            <div className="text-xs text-red-600 mt-1">{error}</div>
          </div>
          <button
            onClick={clearError}
            className="flex-shrink-0 text-red-400 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition-colors"
            title="오류 메시지 닫기"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* 구글 로그인 버튼 - 개선된 디자인 */}
      <div className="flex flex-col items-end gap-3">
        <button
          onClick={handleSignIn}
          className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
          style={{ minWidth: '200px' }}
        >
          {/* 구글 로고 SVG - 더 큰 사이즈 */}
          <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          
          <div className="flex flex-col text-left flex-grow">
            <span className="text-base font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
              구글로 로그인
            </span>
            <span className="text-sm text-gray-500">
              데이터 클라우드 저장
            </span>
          </div>
        </button>

        {/* 로그인 혜택 안내 */}
        <div className="text-xs text-gray-500 text-right max-w-48 leading-relaxed">
          💾 <strong>자동 백업</strong> • 🔄 <strong>멀티 디바이스</strong> • 📱 <strong>어디서나 접속</strong>
        </div>
      </div>
    </div>
  )
}