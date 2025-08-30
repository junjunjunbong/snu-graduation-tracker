import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CreditTxn, SemesterType, BucketType, Totals, RequirementStatus, MajorType } from '../types'
import { DEFAULT_SEMESTERS } from '../types'
import { calculateTotals, calculateRequirementStatus, validateCredits } from '../utils/calculations'
import { supabase } from '../lib/supabase'

interface CreditStore {
  // State
  transactions: CreditTxn[]
  totals: Totals
  requirements: RequirementStatus[]
  semesters: SemesterType[]
  isLoading: boolean
  
  // Actions
  addTransaction: (term: SemesterType, bucket: BucketType, credits: number, courseName?: string, major?: MajorType, note?: string) => Promise<boolean>
  removeTransaction: (id: string) => Promise<void>
  updateTransaction: (id: string, credits: number, courseName?: string, major?: MajorType, note?: string) => Promise<boolean>
  clearAllTransactions: () => Promise<void>
  
  // Semester management
  addSemester: (semester: SemesterType) => boolean
  removeSemester: (semester: SemesterType) => boolean
  
  // Supabase sync
  loadFromSupabase: () => Promise<boolean>
  syncToSupabase: () => Promise<boolean>
  
  // Internal methods
  recalculate: () => void
  generateId: () => string
}

interface ProfileStore {
  dualMajorEnabled: boolean
  toggleDualMajor: () => void
}

// Helper function to get current auth user
const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
}

// 학점 관리 스토어
export const useCreditStore = create<CreditStore>()(
  persist(
    (set, get) => {
      const store = {
        transactions: [],
        totals: {
          majorRequiredTotal: 0,
          majorElectiveTotal: 0,
          majorTotal: 0,
          liberalTotal: 0,
          engCommonTotal: 0,
          dualMajorRequiredTotal: 0,
          dualMajorElectiveTotal: 0,
          dualMajorTotal: 0,
          graduationTotal: 0
        },
        requirements: [],
        semesters: [...DEFAULT_SEMESTERS],
        isLoading: false,

      addTransaction: async (term: SemesterType, bucket: BucketType, credits: number, courseName?: string, major?: MajorType, note?: string) => {
        if (!validateCredits(credits)) {
          return false
        }

        const newTransaction: CreditTxn = {
          id: get().generateId(),
          term,
          bucket,
          credits,
          courseName,
          major,
          note,
          createdAt: new Date()
        }

        // 로컬에 먼저 추가
        set(state => ({
          transactions: [...state.transactions, newTransaction]
        }))
        get().recalculate()

        // Supabase에 동기화
        await get().syncToSupabase()
        return true
      },

      removeTransaction: async (id: string) => {
        set(state => ({
          transactions: state.transactions.filter(txn => txn.id !== id)
        }))
        get().recalculate()
        await get().syncToSupabase()
      },

      updateTransaction: async (id: string, credits: number, courseName?: string, major?: MajorType, note?: string) => {
        if (!validateCredits(credits)) {
          return false
        }

        set(state => ({
          transactions: state.transactions.map(txn =>
            txn.id === id ? { ...txn, credits, courseName, major, note } : txn
          )
        }))

        get().recalculate()
        await get().syncToSupabase()
        return true
      },

      clearAllTransactions: async () => {
        set({ transactions: [] })
        get().recalculate()
        await get().syncToSupabase()
      },

      addSemester: (semester: SemesterType) => {
        const { semesters } = get()
        if (semesters.includes(semester)) {
          return false
        }
        
        set(state => ({
          semesters: [...state.semesters, semester]
        }))
        return true
      },

      removeSemester: (semester: SemesterType) => {
        const { transactions } = get()
        // 해당 학기에 거래가 있으면 삭제 불가
        const hasTransactions = transactions.some(txn => txn.term === semester)
        if (hasTransactions) {
          return false
        }
        
        set(state => ({
          semesters: state.semesters.filter(s => s !== semester)
        }))
        return true
      },

      loadFromSupabase: async () => {
        const user = await getCurrentUser()
        if (!user) return false

        try {
          set({ isLoading: true })

          // 사용자 데이터 가져오기
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('google_id', user.id)
            .single()

          if (userError || !userData) {
            console.log('새 사용자 - 데이터가 없음')
            set({ isLoading: false })
            return false
          }

          // 프로필 데이터 가져오기
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userData.id)
            .single()

          if (profileData) {
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

            set({ transactions: localTransactions })
            get().recalculate()
          }

          set({ isLoading: false })
          return true
        } catch (error) {
          console.error('Supabase 데이터 로드 실패:', error)
          set({ isLoading: false })
          return false
        }
      },

      syncToSupabase: async () => {
        const user = await getCurrentUser()
        if (!user) return false

        try {
          const { transactions } = get()
          const profileStore = useProfileStore.getState()

          // 사용자 확인/생성
          const { data: userData, error: userError } = await supabase
            .from('users')
            .upsert({
              google_id: user.id,
              email: user.email || '',
              name: user.user_metadata?.full_name || null,
              picture_url: user.user_metadata?.avatar_url || null
            })
            .select()
            .single()

          if (userError) throw userError

          // 프로필 데이터 동기화
          await supabase
            .from('user_profiles')
            .upsert({
              user_id: userData.id,
              dual_major_enabled: profileStore.dualMajorEnabled,
              settings: {}
            })

          // 기존 트랜잭션 삭제 후 새로 삽입
          await supabase
            .from('credit_transactions')
            .delete()
            .eq('user_id', userData.id)

          // 새 트랜잭션 삽입
          if (transactions.length > 0) {
            const transactionsToInsert = transactions.map(txn => ({
              user_id: userData.id,
              term: txn.term,
              bucket: txn.bucket,
              credits: txn.credits,
              course_name: txn.courseName || null,
              major_type: txn.major || null,
              note: txn.note || null
            }))

            await supabase
              .from('credit_transactions')
              .insert(transactionsToInsert)
          }

          return true
        } catch (error) {
          console.error('Supabase 동기화 실패:', error)
          return false
        }
      },

      recalculate: () => {
        const { transactions } = get()
        // ProfileStore에서 dualMajorEnabled 가져오기
        const dualMajorEnabled = useProfileStore.getState().dualMajorEnabled
        
        const totals = calculateTotals(transactions)
        const requirements = calculateRequirementStatus(transactions, undefined, dualMajorEnabled)
        
        set({ totals, requirements })
      },

      generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2)
      }
    }

    // 초기화 시에 기본 요건 계산
    setTimeout(() => {
      store.recalculate()
    }, 0)

    return store
    },
    {
      name: 'snu-credit-store',
      version: 1
    }
  )
)

// 프로필 관리 스토어
export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      dualMajorEnabled: false,
      
      toggleDualMajor: () => {
        set(state => ({ dualMajorEnabled: !state.dualMajorEnabled }))
        // 복수전공 토글 시 학점 재계산
        useCreditStore.getState().recalculate()
      }
    }),
    {
      name: 'snu-profile-store',
      version: 1
    }
  )
)