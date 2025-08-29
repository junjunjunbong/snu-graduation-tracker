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
        set({ isLoading: true, error: null })
        
        try {
          const { error } = await supabase.auth.signOut()
          if (error) throw error
          
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '로그아웃 중 오류가 발생했습니다'
          set({ error: errorMessage, isLoading: false })
        }
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
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
      // 저장된 상태가 복원될 때 세션 검증
      onRehydrateStorage: () => (state) => {
        if (state?.isAuthenticated && state?.user) {
          console.log('💾 저장된 인증 상태 복원 시도:', state.user.email)
          // 실제 세션 유효성 검증을 위해 지연 실행
          setTimeout(async () => {
            try {
              const { data: { session }, error } = await supabase.auth.getSession()
              if (error) throw error
              
              if (session?.user) {
                console.log('✅ 저장된 상태 + 유효한 세션 확인됨')
                // 세션이 유효하면 데이터 동기화
                const authStore = useAuthStore.getState()
                if (authStore.isAuthenticated) {
                  await authStore.syncDataFromCloud()
                }
              } else {
                console.log('❌ 저장된 상태가 있지만 세션이 만료됨 - 로그아웃 처리')
                useAuthStore.setState({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: null
                })
              }
            } catch (error) {
              console.error('저장된 상태 검증 실패:', error)
              useAuthStore.setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
              })
            }
          }, 100)
        } else {
          // 저장된 인증 상태가 없으면 일반 세션 체크
          setTimeout(() => {
            if (!window.location.hash) {
              initializeAuth()
            }
          }, 300)
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
      console.log('✅ 세션 복원 성공:', session.user.email)
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

      // 세션 복원 후 데이터 동기화
      const authStore = useAuthStore.getState()
      await authStore.syncDataFromCloud()
      
      console.log('🎉 로그인 완료 및 데이터 동기화 성공')
    } else {
      console.log('❌ 기존 세션 없음')
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

// OAuth 해시 감지 및 처리
const handleOAuthCallback = () => {
  const hash = window.location.hash
  if (hash && hash.includes('access_token')) {
    console.log('🔑 OAuth 해시 감지 - React에서 처리 예정:', hash.substring(0, 50) + '...')
    // OAuth 콜백이므로 세션 초기화 실행
    setTimeout(() => {
      initializeAuth()
    }, 100)
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
  handleOAuthCallback()
  forceCleanUrl()
})

window.addEventListener('DOMContentLoaded', () => {
  handleOAuthCallback()  
  forceCleanUrl()
})

// 즉시 OAuth 감지 시도
handleOAuthCallback()

// 일반적인 경우 세션 초기화
setTimeout(() => {
  if (!window.location.hash) {
    initializeAuth()
  }
}, 200)

// Supabase 인증 상태 변경 감지 - 강화된 세션 관리
supabase.auth.onAuthStateChange(async (event, session) => {
  const authStore = useAuthStore.getState()

  console.log('🔄 인증 상태 변경:', event, session?.user?.email)

  if (event === 'SIGNED_IN' && session?.user) {
    console.log('✅ SIGNED_IN 이벤트 - 세션 설정 중...')
    
    const user: GoogleUser = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata.full_name,
      picture: session.user.user_metadata.avatar_url
    }

    // 상태 즉시 업데이트
    useAuthStore.setState({
      user,
      isAuthenticated: true,
      isLoading: false,
      error: null
    })

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
      // 데이터 마이그레이션 처리 (비동기)
      console.log('💾 데이터 마이그레이션 시작...')
      await authStore.handleDataMigration()
      console.log('✅ 데이터 마이그레이션 완료')
    } catch (error) {
      console.error('❌ 데이터 마이그레이션 실패:', error)
    }
    
    // 최종 URL 정리
    setTimeout(forceCleanUrl, 1500)
    
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 로그아웃 처리')
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    })
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