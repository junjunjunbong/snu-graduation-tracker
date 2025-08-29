import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CreditTxn, SemesterType, BucketType, Totals, RequirementStatus, MajorType } from '../types'
import { DEFAULT_SEMESTERS } from '../types'
import { calculateTotals, calculateRequirementStatus, validateCredits } from '../utils/calculations'

interface CreditStore {
  // State
  transactions: CreditTxn[]
  totals: Totals
  requirements: RequirementStatus[]
  semesters: SemesterType[]
  
  // Actions
  addTransaction: (term: SemesterType, bucket: BucketType, credits: number, courseName?: string, major?: MajorType, note?: string) => boolean
  removeTransaction: (id: string) => void
  updateTransaction: (id: string, credits: number, courseName?: string, major?: MajorType, note?: string) => boolean
  clearAllTransactions: () => void
  
  // Semester management
  addSemester: (semester: SemesterType) => boolean
  removeSemester: (semester: SemesterType) => boolean
  
  // Internal methods
  recalculate: () => void
  generateId: () => string
}

interface ProfileStore {
  dualMajorEnabled: boolean
  toggleDualMajor: () => void
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

      addTransaction: (term: SemesterType, bucket: BucketType, credits: number, courseName?: string, major?: MajorType, note?: string) => {
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

        set(state => ({
          transactions: [...state.transactions, newTransaction]
        }))

        get().recalculate()
        return true
      },

      removeTransaction: (id: string) => {
        set(state => ({
          transactions: state.transactions.filter(txn => txn.id !== id)
        }))
        get().recalculate()
      },

      updateTransaction: (id: string, credits: number, courseName?: string, major?: MajorType, note?: string) => {
        if (!validateCredits(credits)) {
          return false
        }

        set(state => ({
          transactions: state.transactions.map(txn =>
            txn.id === id ? { ...txn, credits, courseName, major, note } : txn
          )
        }))

        get().recalculate()
        return true
      },

      clearAllTransactions: () => {
        set({ transactions: [] })
        get().recalculate()
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