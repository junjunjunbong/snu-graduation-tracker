import type { CreditTxn, BucketType, Totals, RequirementStatus, RuleSet } from '../types'
import { DEFAULT_RULES } from '../types'

/**
 * 학점 거래 기록들로부터 총 학점 계산
 */
export function calculateTotals(transactions: CreditTxn[]): Totals {
  const totals: Totals = {
    majorRequiredTotal: 0,
    majorElectiveTotal: 0,
    majorTotal: 0,
    liberalTotal: 0,
    engCommonTotal: 0,
    dualMajorRequiredTotal: 0,
    dualMajorElectiveTotal: 0,
    dualMajorTotal: 0,
    graduationTotal: 0
  }

  transactions.forEach(txn => {
    switch (txn.bucket) {
      case 'MR': // 전공필수
        totals.majorRequiredTotal += txn.credits
        totals.majorTotal += txn.credits
        totals.graduationTotal += txn.credits
        break
      case 'ME': // 전공선택
        totals.majorElectiveTotal += txn.credits
        totals.majorTotal += txn.credits
        totals.graduationTotal += txn.credits
        break
      case 'LB': // 교양 (기본소양+MSC 통합)
        totals.liberalTotal += txn.credits
        totals.graduationTotal += txn.credits
        break
      case 'EC': // 공대공통
        totals.engCommonTotal += txn.credits
        totals.graduationTotal += txn.credits
        break
      case 'OMR': // 복수전공필수
        totals.dualMajorRequiredTotal += txn.credits
        totals.dualMajorTotal += txn.credits
        totals.graduationTotal += txn.credits
        break
      case 'OME': // 복수전공선택
        totals.dualMajorElectiveTotal += txn.credits
        totals.dualMajorTotal += txn.credits
        totals.graduationTotal += txn.credits
        break
    }
  })

  return totals
}

/**
 * 버킷별 학점 합계 계산
 */
export function calculateByBucket(transactions: CreditTxn[]): Record<BucketType, number> {
  const buckets: Record<BucketType, number> = {
    MR: 0,
    ME: 0,
    LB: 0,
    EC: 0,
    OMR: 0,
    OME: 0
  }

  transactions.forEach(txn => {
    buckets[txn.bucket] += txn.credits
  })

  return buckets
}

/**
 * 요건별 진행 상황 계산
 */
export function calculateRequirementStatus(
  transactions: CreditTxn[], 
  rules: RuleSet = DEFAULT_RULES,
  dualMajorEnabled: boolean = false
): RequirementStatus[] {
  const totals = calculateTotals(transactions)
  const status: RequirementStatus[] = []

  // 전공 요건 (복수전공 활성화시 48학점, 아니면 62학점)
  const majorRequired = dualMajorEnabled ? 48 : rules.majorMin
  status.push({
    bucket: '전공',
    current: totals.majorTotal,
    required: majorRequired,
    remaining: Math.max(0, majorRequired - totals.majorTotal),
    isComplete: totals.majorTotal >= majorRequired,
    percentage: Math.min(100, (totals.majorTotal / majorRequired) * 100)
  })

  // 교양 요건 (기본소양+MSC 통합)
  status.push({
    bucket: '교양',
    current: totals.liberalTotal,
    required: rules.liberalMin,
    remaining: Math.max(0, rules.liberalMin - totals.liberalTotal),
    isComplete: totals.liberalTotal >= rules.liberalMin,
    percentage: Math.min(100, (totals.liberalTotal / rules.liberalMin) * 100)
  })

  // 공대공통 요건
  status.push({
    bucket: '공대공통',
    current: totals.engCommonTotal,
    required: rules.engCommonMin,
    remaining: Math.max(0, rules.engCommonMin - totals.engCommonTotal),
    isComplete: totals.engCommonTotal >= rules.engCommonMin,
    percentage: Math.min(100, (totals.engCommonTotal / rules.engCommonMin) * 100)
  })

  // 복수전공 요건 (활성화된 경우만)
  if (dualMajorEnabled) {
    status.push({
      bucket: '복수전공',
      current: totals.dualMajorTotal,
      required: rules.dualMajorMin,
      remaining: Math.max(0, rules.dualMajorMin - totals.dualMajorTotal),
      isComplete: totals.dualMajorTotal >= rules.dualMajorMin,
      percentage: Math.min(100, (totals.dualMajorTotal / rules.dualMajorMin) * 100)
    })
  }

  // 졸업 요건
  status.push({
    bucket: '졸업',
    current: totals.graduationTotal,
    required: rules.graduationMin,
    remaining: Math.max(0, rules.graduationMin - totals.graduationTotal),
    isComplete: totals.graduationTotal >= rules.graduationMin,
    percentage: Math.min(100, (totals.graduationTotal / rules.graduationMin) * 100)
  })

  return status
}

/**
 * 학점 입력 유효성 검사
 */
export function validateCredits(credits: number): boolean {
  // 음수 불가
  if (credits < 0) return false
  
  // 0.5 단위 허용
  if ((credits * 2) % 1 !== 0) return false
  
  // 최대 30학점 (일반적인 학기당 최대)
  if (credits > 30) return false
  
  return true
}

/**
 * 학기별 학점 계산
 */
export function calculateBySemester(transactions: CreditTxn[]) {
  const semesterTotals: Record<string, Record<BucketType, number>> = {}
  
  transactions.forEach(txn => {
    if (!semesterTotals[txn.term]) {
      semesterTotals[txn.term] = { MR: 0, ME: 0, LB: 0, EC: 0, OMR: 0, OME: 0 }
    }
    semesterTotals[txn.term][txn.bucket] += txn.credits
  })
  
  return semesterTotals
}

/**
 * 전체 졸업 요건 충족 여부 검사
 */
export function checkGraduationEligibility(
  transactions: CreditTxn[],
  rules: RuleSet = DEFAULT_RULES,
  dualMajorEnabled: boolean = false
): boolean {
  const status = calculateRequirementStatus(transactions, rules, dualMajorEnabled)
  
  // 복수전공이 활성화된 경우 복수전공 요건도 확인
  if (dualMajorEnabled) {
    return status.every(req => req.isComplete)
  } else {
    // 복수전공 제외하고 확인
    return status.filter(req => req.bucket !== '복수전공').every(req => req.isComplete)
  }
}