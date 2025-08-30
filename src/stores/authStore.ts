import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../lib/supabase'
import type { CreditTxn } from '../types'
import { useCreditStore, useProfileStore } from './creditStore'

export interface GoogleUser {
  id: string
  email: string
  name?: string
  picture?: string
}

interface AuthStore {
  // State
  user: GoogleUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  signInWithGoogle: () => Promise<boolean>
  signOut: () => Promise<void>
  fastSignOut: () => Promise<void>
  clearError: () => void
  
  // Data sync
  syncDataToCloud: () => Promise<boolean>
  syncDataFromCloud: () => Promise<boolean>
  handleDataMigration: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false, // 세션 체크 후 업데이트
      error: null,

      signInWithGoogle: async () => {
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin,
              queryParams: {
                access_type: 'offline',
                prompt: 'consent',
              }
            }
          })

          if (error) throw error

          // OAuth 플로우가 시작되면 리다이렉트됩니다
          return true
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다'
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      signOut: async () => {
        console.log('🚪 로그아웃 시작...')
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          
          console.log('✅ Supabase 로그아웃 성공')
          
          // 상태 초기화 (partialize에서 빈 객체를 저장하게 됨)
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null
          })

          console.log('✅ 로컬 상태 초기화 완료')

          // 확실하게 localStorage 제거 (persist가 저장한 후에 제거)
          setTimeout(() => {
            localStorage.removeItem('snu-auth-store')
            console.log('✅ localStorage 인증 정보 제거 완료')
          }, 100)
          
          console.log('🎉 로그아웃 완료')
        } catch (error) {
          console.error('❌ 로그아웃 실패:', error)
          const errorMessage = error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다'
          set({ error: errorMessage, isLoading: false })
        }
      },

      fastSignOut: async () => {
        console.log('🚪 로그아웃 시작 (fastSignOut)')
        // Fast, local-first sign out to avoid hanging on network issues
        set({ isLoading: true, error: null })
        // Immediately update local app state so UI never hangs
        set({ user: null, isAuthenticated: false, isLoading: false, error: null })
        console.log('✅ 로컬 상태 초기화 완료 (immediate)')
        // Remove persisted auth key ASAP
        setTimeout(() => {
          try { localStorage.removeItem('snu-auth-store'); console.log('🗑️ snu-auth-store 제거') } catch {}
        }, 0)
        // Remove Supabase auth-token keys defensively (localStorage + sessionStorage)
        try {
          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (k && k.startsWith('sb-') && k.includes('auth-token')) keysToRemove.push(k)
          }
          keysToRemove.forEach(k => localStorage.removeItem(k))
          if (keysToRemove.length) console.log(`🧽 sb auth-token ${keysToRemove.length}개 제거`)
          // sessionStorage too (rare)
          const sKeys: string[] = []
          for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i)
            if (k && k.startsWith('sb-') && k.includes('auth-token')) sKeys.push(k)
          }
          sKeys.forEach(k => sessionStorage.removeItem(k))
          if (sKeys.length) console.log(`🧽 sb(auth-token) 세션 키 ${sKeys.length}개 제거`)
        } catch {}
        // Fire-and-forget local + global signouts with timeouts (do not block UI)
        ;(async () => {
          const withTimeout = (p: Promise<any>, ms: number, label: string) => new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error(label + ' timeout')), ms)
            p.then(v => { clearTimeout(t); resolve(v) })
             .catch(err => { clearTimeout(t); reject(err) })
          })
          try { console.log('🧹 Local signOut(scope: local) 백그라운드 실행'); await withTimeout(supabase.auth.signOut({ scope: 'local' }), 1500, 'signOut(local)'); console.log('✅ Local signOut 완료') } catch (e) { console.warn('⚠️ Local signOut 실패/타임아웃 (ignored):', e) }
          try { console.log('🌐 Global revoke(scope: global) 백그라운드 실행'); await withTimeout(supabase.auth.signOut({ scope: 'global' }), 5000, 'signOut(global)'); console.log('✅ Global revoke 완료') } catch (e) { console.warn('⚠️ Global revoke 실패/타임아웃 (ignored):', e) }
        })()
        return
        try {
          console.log('🧹 Local signOut(scope: local) 시도')
          await supabase.auth.signOut({ scope: 'local' })
        } catch (e) {
          // ignore local signOut errors
          console.warn('⚠️ fastSignOut local error (ignored):', e)
        }
        // Aggressively remove any residual Supabase auth tokens just in case
        try {
          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (k && k.startsWith('sb-') && k.includes('auth-token')) keysToRemove.push(k)
          }
          keysToRemove.forEach(k => localStorage.removeItem(k))
          if (keysToRemove.length) {
            console.log(`🧽 Supabase 토큰 키 ${keysToRemove.length}개 제거`)
          }
        } catch {}
        // Immediately update local app state
        set({ user: null, isAuthenticated: false, isLoading: false, error: null })
        console.log('✅ 로컬 상태 초기화 완료')
        // Clear persisted auth after render
        setTimeout(() => {
          try { 
            localStorage.removeItem('snu-auth-store')
            console.log('🗑️ localStorage 인증 정보 제거 완료')
          } catch {}
        }, 50)
        // Try global revoke in background with timeout so UI isn't blocked
        ;(async () => {
          const withTimeout = (p: Promise<any>, ms: number) => new Promise((resolve, reject) => {
            const t = setTimeout(() => reject(new Error('signOut(global) timeout')), ms)
            p.then(v => { clearTimeout(t); resolve(v) })
             .catch(err => { clearTimeout(t); reject(err) })
          })
          try {
            console.log('🌐 Global revoke(scope: global) 시도')
            await withTimeout(supabase.auth.signOut({ scope: 'global' }), 5000)
            console.log('✅ Global revoke 완료')
          } catch (e) {
            console.warn('⚠️ fastSignOut global revoke 실패/타임아웃 (ignored):', e)
          }
        })()
      },

      clearError: () => {
        set({ error: null })
      },

      syncDataToCloud: async () => {
        const { user, isAuthenticated } = get()
        if (!isAuthenticated || !user) {
          set({ error: '로그인이 필요합니다' })
          return false
        }

        set({ isLoading: true, error: null })

        try {
          // 현재 로컬 데이터 가져오기
          const creditStore = useCreditStore.getState()
          const profileStore = useProfileStore.getState()

          // 사용자 확인/생성
          const { data: userData, error: userError } = await supabase
            .from('users')
            .upsert({
              google_id: user.id,
              email: user.email,
              name: user.name || null,
              picture_url: user.picture || null
            })
            .select()
            .single()

          if (userError) throw userError

          // 프로필 데이터 동기화
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: userData.id,
              dual_major_enabled: profileStore.dualMajorEnabled,
              settings: {}
            })

          if (profileError) throw profileError

          // 기존 트랜잭션 삭제 후 새로 삽입
          const { error: deleteError } = await supabase
            .from('credit_transactions')
            .delete()
            .eq('user_id', userData.id)

          if (deleteError) throw deleteError

          // 새 트랜잭션 삽입
          if (creditStore.transactions.length > 0) {
            const transactionsToInsert = creditStore.transactions.map(txn => ({
              user_id: userData.id,
              term: txn.term,
              bucket: txn.bucket,
              credits: txn.credits,
              course_name: txn.courseName || null,
              major_type: txn.major || null,
              note: txn.note || null
            }))

            const { error: insertError } = await supabase
              .from('credit_transactions')
              .insert(transactionsToInsert)

            if (insertError) throw insertError
          }

          set({ isLoading: false })
          return true
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '데이터 동기화 중 오류가 발생했습니다'
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      syncDataFromCloud: async () => {
        const { user, isAuthenticated } = get()
        if (!isAuthenticated || !user) {
          set({ error: '로그인이 필요합니다' })
          return false
        }

        set({ isLoading: true, error: null })

        try {
          // 사용자 데이터 가져오기
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('google_id', user.id)
            .single()

          if (userError || !userData) {
            // 새 사용자인 경우 로컬 데이터를 클라우드로 동기화
            await get().syncDataToCloud()
            set({ isLoading: false })
            return true
          }

          // 프로필 데이터 가져오기
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userData.id)
            .single()

          if (!profileError && profileData) {
            useProfileStore.setState({
              dualMajorEnabled: profileData.dual_major_enabled
            })
          }

          // 트랜잭션 데이터 가져오기
          const { data: transactions, error: transactionError } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', userData.id)
            .order('created_at', { ascending: true })

          if (transactionError) throw transactionError

          // 로컬 스토어에 데이터 설정
          if (transactions) {
            const localTransactions: CreditTxn[] = transactions.map(txn => ({
              id: txn.id,
              term: txn.term as any,
              bucket: txn.bucket as any,
              credits: txn.credits,
              courseName: txn.course_name || undefined,
              major: txn.major_type as any || undefined,
              note: txn.note || undefined,
              createdAt: new Date(txn.created_at)
            }))

            useCreditStore.setState({
              transactions: localTransactions
            })

            // 계산 업데이트
            useCreditStore.getState().recalculate()
          }

          set({ isLoading: false })
          return true
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '데이터 불러오기 중 오류가 발생했습니다'
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      handleDataMigration: async () => {
        const creditStore = useCreditStore.getState()
        
        // 로컬에 데이터가 있는 경우에만 마이그레이션 제안
        if (creditStore.transactions.length > 0) {
          const shouldMigrate = window.confirm(
            '로컬에 저장된 졸업요건 데이터가 있습니다. 클라우드에 백업하시겠습니까?\n' +
            '백업하면 다른 기기에서도 동일한 데이터를 사용할 수 있습니다.'
          )

          if (shouldMigrate) {
            const success = await get().syncDataToCloud()
            if (success) {
              alert('데이터가 성공적으로 백업되었습니다!')
            }
          }
        } else {
          // 로컬에 데이터가 없으면 클라우드에서 가져오기
          await get().syncDataFromCloud()
        }
      }
    }),
    {
      name: 'snu-auth-store',
      partialize: (state) => {
        // 로그아웃 상태일 때는 아무것도 저장하지 않음
        if (!state.isAuthenticated || !state.user) {
          return {}
        }
        return { 
          user: state.user, 
          isAuthenticated: state.isAuthenticated 
        }
      },
      // 저장된 상태가 복원될 때 세션 검증
      onRehydrateStorage: () => (state) => {
        console.log('💾 Zustand 상태 복원됨:', state?.isAuthenticated ? '인증됨' : '미인증')
        
        if (state?.isAuthenticated && state?.user) {
          console.log('💾 저장된 사용자 정보:', state.user.email)
          // 저장된 상태를 그대로 유지하고, 백그라운드에서 세션 검증만 수행
          setTimeout(async () => {
            try {
              const { data: { session }, error } = await supabase.auth.getSession()
              if (error) {
                console.log('⚠️ 세션 확인 실패, 저장된 상태 유지:', error.message)
                return
              }
              
              if (session?.user) {
                console.log('✅ 세션 유효성 확인 완료')
                // 세션이 유효하면 데이터 로드만 수행
                const authStore = useAuthStore.getState()
                if (authStore.isAuthenticated) {
                  await useCreditStore.getState().loadFromSupabase()
                }
              } else {
                console.log('❌ 세션 만료 - 3초 후 로그아웃 처리')
                // 3초 후에 로그아웃 처리 (사용자가 상태를 볼 수 있도록)
                setTimeout(() => {
                  useAuthStore.setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: '세션이 만료되었습니다. 다시 로그인해주세요.'
                  })
                }, 3000)
              }
            } catch (error) {
              console.error('세션 검증 중 오류:', error)
              // 에러 발생 시에도 저장된 상태 유지
            }
          }, 500)
        } else {
          // 저장된 인증 상태가 없으면 일반 세션 체크
          console.log('💾 저장된 인증 정보 없음 - 세션 체크 시작')
          setTimeout(() => {
            if (!window.location.hash) {
              initializeAuth()
            }
          }, 200)
        }
      }
    }
  )
)

// 초기 세션 확인 - 강화된 세션 복원
const initializeAuth = async () => {
  // 로딩 상태로 설정
  useAuthStore.setState({ isLoading: true, error: null })
  
  try {
    console.log('🔍 OAuth 콜백 처리 시작...')
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('세션 확인 오류:', error)
      useAuthStore.setState({ 
        isLoading: false, 
        error: error.message,
        user: null,
        isAuthenticated: false 
      })
      return
    }

    if (session?.user) {
      console.log('✅ initializeAuth - 세션 복원 성공:', session.user.email)
      const user: GoogleUser = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata?.full_name,
        picture: session.user.user_metadata?.avatar_url
      }

      console.log('💾 initializeAuth - 상태 업데이트 중...')
      useAuthStore.setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

      // 상태 업데이트 확인
      setTimeout(() => {
        const currentState = useAuthStore.getState()
        console.log('🔍 initializeAuth - 상태 업데이트 결과:', {
          isAuthenticated: currentState.isAuthenticated,
          user: currentState.user?.email,
          isLoading: currentState.isLoading
        })
      }, 50)

      // 세션 복원 후 데이터 로드
      try {
        console.log('💾 initializeAuth - 데이터 로드 시작...')
        await useCreditStore.getState().loadFromSupabase()
        console.log('🎉 initializeAuth - 로그인 완료 및 데이터 로드 성공')
      } catch (error) {
        console.error('❌ initializeAuth - 데이터 로드 실패:', error)
      }
    } else {
      console.log('❌ initializeAuth - 기존 세션 없음')
      useAuthStore.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    }
  } catch (error) {
    console.error('세션 초기화 실패:', error)
    useAuthStore.setState({ 
      user: null,
      isAuthenticated: false,
      isLoading: false, 
      error: '세션 초기화 중 오류가 발생했습니다' 
    })
  }
}

// OAuth 콜백 중복 처리 방지 플래그
let oauthHandled = false
let oauthProcessing = false

// OAuth 해시/쿼리 감지 및 처리
const handleOAuthCallback = async () => {
  const hash = window.location.hash || ''
  const search = window.location.search || ''

  // implicit(flow: hash) 또는 PKCE(flow: code) 모두 감지
  const hasImplicitTokens = hash.includes('access_token') ||
    hash.includes('refresh_token') ||
    hash.includes('provider_token') ||
    hash.includes('expires_at') ||
    hash.includes('expires_in') ||
    hash.includes('token_type')
  const hasPkceCode = /[?&]code=/.test(search)

  const isOAuthUrl = hasImplicitTokens || hasPkceCode
  if (!isOAuthUrl || oauthHandled) return

  oauthHandled = true
  oauthProcessing = true

  try {
    console.log('🔑 OAuth 콜백 감지 - URL 세션 처리 시작')

    if (hasPkceCode) {
      // PKCE 코드 교환 처리
      const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href)
      if (error) {
        console.error('🚨 PKCE 코드 교환 실패:', error.message)
      } else if (data?.session?.user) {
        console.log('✅ PKCE 세션 저장 완료:', data.session.user.email)
      } else {
        console.log('⚠️ PKCE 교환 후 세션이 비어있습니다')
      }
    } else if (hasImplicitTokens) {
      // Implicit 해시 토큰 직접 파싱 후 세션 설정
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''))
      const access_token = hashParams.get('access_token') || ''
      const refresh_token = hashParams.get('refresh_token') || ''

      if (!access_token) {
        console.error('🚨 해시에서 access_token을 찾을 수 없습니다')
      } else if (!refresh_token) {
        console.warn('⚠️ 해시에 refresh_token이 없습니다. 세션 자동 복원을 대기합니다')
        // 잠시 대기 후 세션 확인 (라이브러리가 처리했는지 확인)
        await new Promise((r) => setTimeout(r, 100))
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('🚨 세션 확인 실패:', error.message)
        } else if (data?.session?.user) {
          console.log('✅ OAuth 세션 확인 완료:', data.session.user.email)
        } else {
          console.warn('⚠️ 세션을 확인할 수 없습니다')
        }
      } else {
        const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (error) {
          console.error('🚨 세션 설정 실패:', error.message)
        } else if (data?.session?.user) {
          console.log('✅ OAuth 세션 저장 완료:', data.session.user.email)
        }
      }
    }
  } catch (e) {
    console.error('🚨 OAuth 콜백 처리 중 예외:', e)
  } finally {
    // 토큰/코드가 담긴 URL 정리
    forceCleanUrl()
    oauthProcessing = false
  }
}

// 강력한 URL 정리 함수
const forceCleanUrl = () => {
  if (window.location.hash || window.location.search) {
    console.log('🧹 강제 URL 정리 실행...')
    window.history.replaceState({}, document.title, window.location.origin + window.location.pathname)
    console.log('✨ URL 완전 정리 완료!')
  }
}

// 페이지 로드 시 OAuth 처리 및 URL 정리
window.addEventListener('load', () => {
  // 먼저 OAuth 콜백을 처리하고, 정리는 내부에서 수행
  void handleOAuthCallback()
})

window.addEventListener('DOMContentLoaded', () => {
  // DOM 로드 시에도 한 번 더 시도 (중복 방지됨)
  void handleOAuthCallback()
})

// 즉시 OAuth 감지 시도 (중복 방지됨)
void handleOAuthCallback()

// 일반적인 경우 세션 초기화
setTimeout(() => {
  // OAuth 콜백 처리 중이 아니고, URL에 토큰/코드가 없을 때만 초기화
  if (!window.location.hash && !window.location.search && !oauthProcessing) {
    initializeAuth()
  }
}, 200)

// Supabase 인증 상태 변경 감지 - 강화된 세션 관리
supabase.auth.onAuthStateChange(async (event, session) => {
  const authStore = useAuthStore.getState()

  console.log('🔄 인증 상태 변경:', event, session?.user?.email)

  if (event === 'SIGNED_IN' && session?.user) {
    console.log('🎉 SIGNED_IN 이벤트 - 로그인 성공!')
    console.log('👤 사용자 정보:', {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.full_name
    })
    
    const user: GoogleUser = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.full_name,
      picture: session.user.user_metadata?.avatar_url
    }

    // 상태 즉시 업데이트
    console.log('💾 인증 상태 업데이트 중...')
    useAuthStore.setState({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    })
    
    // 상태 업데이트 확인
    setTimeout(() => {
      const currentState = useAuthStore.getState()
      console.log('🔍 현재 인증 상태:', {
        isAuthenticated: currentState.isAuthenticated,
        user: currentState.user?.email,
        isLoading: currentState.isLoading
      })
    }, 100)

    // URL 정리 함수
    const cleanUrl = () => {
      const shouldClean = window.location.hash && (
        window.location.hash.includes('access_token') || 
        window.location.hash.includes('refresh_token') ||
        window.location.hash.includes('provider_token') ||
        window.location.hash.includes('expires_at') ||
        window.location.hash.includes('expires_in') ||
        window.location.hash.includes('token_type')
      )
      
      if (shouldClean) {
        console.log('🧹 OAuth 토큰 URL 정리 중...')
        window.history.replaceState({}, document.title, window.location.pathname)
        console.log('✨ URL 정리 완료!')
      }
    }
    
    // 즉시 및 지연 URL 정리
    cleanUrl()
    setTimeout(cleanUrl, 100)
    setTimeout(cleanUrl, 500)
    setTimeout(cleanUrl, 1000)

    try {
      // 데이터 로드 처리 (비동기)
      console.log('💾 데이터 로드 시작...')
      await useCreditStore.getState().loadFromSupabase()
      console.log('✅ 데이터 로드 완료')
    } catch (error) {
      console.error('❌ 데이터 로드 실패:', error)
    }
    
    // 최종 URL 정리
    setTimeout(forceCleanUrl, 1500)
    
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 SIGNED_OUT 이벤트 - 로그아웃 처리')
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })

    // persist가 빈 객체를 저장한 후에 localStorage 완전 제거
    setTimeout(() => {
      localStorage.removeItem('snu-auth-store')
      console.log('✅ SIGNED_OUT: localStorage 인증 정보 제거 완료')
    }, 100)
  } else if (event === 'TOKEN_REFRESHED' && session?.user) {
    console.log('🔄 토큰 갱신됨 - 세션 유지')
    
    // 기존 사용자 정보가 없으면 업데이트
    const currentUser = authStore.user
    if (!currentUser || !authStore.isAuthenticated) {
      const user: GoogleUser = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata.full_name,
        picture: session.user.user_metadata.avatar_url
      }

      useAuthStore.setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
      
      console.log('🔄 토큰 갱신 시 세션 복원:', user.email)
    }
    
    // URL 정리
    setTimeout(() => {
      if (window.location.hash) {
        console.log('🔄 토큰 갱신 후 URL 정리 중...')
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }, 100)
  } else if (event === 'INITIAL_SESSION') {
    console.log('🔍 기타 인증 이벤트: INITIAL_SESSION', session?.user?.email)
    // INITIAL_SESSION에서도 세션이 있으면 복원
    if (session?.user) {
      const user: GoogleUser = {
        id: session.user.id,
        email: session.user.email || '',
        name: session.user.user_metadata.full_name,
        picture: session.user.user_metadata.avatar_url
      }

      useAuthStore.setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })
      
      console.log('🔄 INITIAL_SESSION에서 세션 복원:', user.email)
    }
  } else {
    console.log('🔍 기타 인증 이벤트:', event)
  }
})
