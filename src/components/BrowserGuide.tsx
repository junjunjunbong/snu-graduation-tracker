import { useState, useEffect } from 'react'

export function BrowserGuide() {
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    // 외부 앱에서 접속했는지 감지
    const isExternalApp = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isInApp = 
        userAgent.includes('kakaotalk') || 
        userAgent.includes('instagram') || 
        userAgent.includes('facebook') || 
        userAgent.includes('twitter') || 
        userAgent.includes('line') || 
        userAgent.includes('whatsapp') ||
        userAgent.includes('telegram') ||
        (userAgent.includes('mobile') && !userAgent.includes('safari') && !userAgent.includes('chrome'))
      
      return isInApp
    }

    // 외부 앱에서 접속하고 localStorage에 안내를 본 적이 없으면 표시
    if (isExternalApp() && !localStorage.getItem('browser-guide-seen')) {
      setShowGuide(true)
    }
  }, [])

  const handleClose = () => {
    setShowGuide(false)
    localStorage.setItem('browser-guide-seen', 'true')
  }

  const handleOpenInBrowser = () => {
    // 현재 URL 복사
    navigator.clipboard?.writeText(window.location.href).then(() => {
      alert('링크가 복사되었습니다! 브라우저에서 붙여넣기 해주세요.')
    }).catch(() => {
      // 복사 실패 시 수동으로 URL 표시
      const url = window.location.href
      prompt('아래 링크를 브라우저에서 열어주세요:', url)
    })
  }

  const openInSafari = () => {
    const safariUrl = window.location.href.replace('https://', 'safari:')
    window.location.href = safariUrl
  }

  const openInChrome = () => {
    const chromeUrl = 'googlechrome://' + window.location.href
    window.location.href = chromeUrl
  }

  if (!showGuide) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
        >
          ×
        </button>
        
        <div className="text-center">
          <div className="text-4xl mb-4">🌐</div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">
            브라우저로 열기 권장
          </h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            구글 로그인이 원활하지 않을 수 있습니다.<br/>
            <strong>Safari나 Chrome</strong>에서 열어주세요!
          </p>
          
          {/* 브라우저 버튼들 */}
          <div className="space-y-3">
            <button
              onClick={openInSafari}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
              Safari에서 열기
            </button>
            
            <button
              onClick={openInChrome}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Chrome에서 열기
            </button>
            
            <button
              onClick={handleOpenInBrowser}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              📋
              링크 복사하기
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              그냥 계속하기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}