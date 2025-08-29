// 학점 버킷 타입
export type BucketType = 'MR' | 'ME' | 'LB' | 'EC' | 'OMR' | 'OME'

// 학기 타입 (동적으로 확장 가능)
export type SemesterType = string

// 주전공 타입
export type MajorType = 'MAJOR' | 'DUAL'

// 학점 거래 기록
export interface CreditTxn {
  id: string
  term: SemesterType
  bucket: BucketType
  major?: MajorType // 전공필수/전공선택인 경우 주전공 구분
  credits: number // 0.5 단위 허용
  courseName?: string // 과목명
  note?: string
  createdAt: Date
}

// 사용자 프로필
export interface Profile {
  id: string
  name: string
  studentId: string
  major: string
  dualMajorEnabled: boolean
}

// 졸업 요건 규칙
export interface RuleSet {
  majorRequiredMin: number     // 전공필수 최소
  majorElectiveMin: number     // 전공선택 최소  
  majorMin: number             // 전공 전체 최소 (기본: 62)
  liberalMin: number           // 교양 최소 (50학점)
  engCommonMin: number         // 공대공통 최소 (기본: 3)
  dualMajorRequiredMin: number // 복수전공 필수 최소
  dualMajorElectiveMin: number // 복수전공 선택 최소
  dualMajorMin: number         // 복수전공 전체 최소 (기본: 48)
  graduationMin: number        // 졸업 최소 (기본: 130)
}

// 계산된 학점 총합
export interface Totals {
  majorRequiredTotal: number     // 전공필수 합계
  majorElectiveTotal: number     // 전공선택 합계
  majorTotal: number             // 전공 전체 합계 (전필+전선)
  liberalTotal: number           // 교양 합계 (기본소양+MSC 통합)
  engCommonTotal: number         // 공대공통 합계
  dualMajorRequiredTotal: number // 복수전공 필수 합계
  dualMajorElectiveTotal: number // 복수전공 선택 합계
  dualMajorTotal: number         // 복수전공 전체 합계
  graduationTotal: number        // 전체 합계
}

// 요건별 진행 상황
export interface RequirementStatus {
  bucket: string
  current: number
  required: number
  remaining: number
  isComplete: boolean
  percentage: number
}

// 버킷 라벨 맵핑
export const BUCKET_LABELS: Record<BucketType, string> = {
  MR: '전공필수',
  ME: '전공선택', 
  LB: '교양',
  EC: '공대공통',
  OMR: '복수전공필수',
  OME: '복수전공선택'
}

// 주전공 라벨 맵핑
export const MAJOR_LABELS: Record<MajorType, string> = {
  MAJOR: '주전공',
  DUAL: '복수전공'
}

// 기본 학기 목록
export const DEFAULT_SEMESTERS: SemesterType[] = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2']

// 학기 라벨 생성 함수
export function getSemesterLabel(semester: SemesterType): string {
  const match = semester.match(/^(\d+)-([12])$/)
  if (match) {
    const [, year, term] = match
    return `${year}학년 ${term}학기`
  }
  return semester
}

// 기본 졸업 요건 (간소화된 버전)
export const DEFAULT_RULES: RuleSet = {
  majorRequiredMin: 36,        // 전공필수 최소
  majorElectiveMin: 26,        // 전공선택 최소 (62 - 36 = 26)
  majorMin: 62,                // 전공 전체 최소 (단일전공)
  liberalMin: 50,              // 교양 최소
  engCommonMin: 3,             // 공대공통 최소
  dualMajorRequiredMin: 20,    // 복수전공 필수 최소 (39의 절반 정도)
  dualMajorElectiveMin: 19,    // 복수전공 선택 최소 (39의 절반 정도)
  dualMajorMin: 39,            // 복수전공 전체 최소
  graduationMin: 130           // 졸업 최소
}