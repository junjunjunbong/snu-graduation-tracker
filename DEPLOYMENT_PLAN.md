# SNU 졸업요건 트래커 - 구글 로그인 포함 배포 계획

## 📋 프로젝트 개요
- **이름**: SNU 졸업요건 트래커 (Google Auth 통합)
- **목적**: 서울대학교 학생들의 졸업요건 추적 + 개인화된 데이터 관리
- **기술스택**: React 19 + TypeScript + Vite + Zustand + Google OAuth

## 🏗️ 아키텍처 변경사항

### 현재 (LocalStorage 기반)
```
Frontend (React) → LocalStorage → 데이터 영구 저장
```

### 변경 후 (Google Auth + Cloud 동기화)
```
Frontend (React) → Google OAuth → Backend API → Database → Cloud Sync
```

## 🔐 구글 로그인 통합 계획

### 1. 인증 시스템 설계

#### Frontend 변경사항
- **라이브러리**: `@google-cloud/oauth2` 또는 `firebase/auth`
- **상태관리**: Zustand에 `authStore` 추가
- **UI 컴포넌트**: 로그인/로그아웃 버튼, 사용자 프로필

```typescript
interface AuthStore {
  user: GoogleUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  syncData: () => Promise<void>
}

interface GoogleUser {
  id: string
  email: string
  name: string
  picture: string
}
```

#### Backend 요구사항
- **플랫폼**: Vercel Functions 또는 Supabase
- **데이터베이스**: Supabase PostgreSQL 또는 PlanetScale MySQL
- **인증 검증**: Google OAuth 토큰 검증
- **API 엔드포인트**:
  - `POST /api/auth/verify` - 토큰 검증
  - `GET/POST /api/user/data` - 사용자 데이터 CRUD
  - `POST /api/user/sync` - 로컬-클라우드 데이터 동기화

### 2. 데이터 마이그레이션 전략

#### 기존 데이터 보존
```typescript
interface MigrationStrategy {
  // 기존 LocalStorage 데이터 유지
  preserveLocalData: boolean
  
  // 첫 로그인 시 마이그레이션 제안
  offerDataMigration: boolean
  
  // 오프라인 모드 지원
  offlineMode: boolean
  
  // 데이터 충돌 해결
  conflictResolution: 'local' | 'cloud' | 'merge' | 'ask-user'
}
```

#### 하이브리드 동기화
- **로컬 우선**: 오프라인에서도 작동
- **클라우드 백업**: 로그인 시 자동 동기화
- **충돌 해결**: 타임스탬프 기반 최신 데이터 우선

## 🚀 배포 플랫폼 선택

### 추천: Vercel + Supabase 조합

#### Vercel (Frontend + API)
- **장점**: React 최적화, 서버리스 함수, 무료 배포
- **API Routes**: `/api/auth/*`, `/api/user/*`
- **환경변수**: Google OAuth 키, Supabase 연결 정보

#### Supabase (Backend + Database)
- **장점**: PostgreSQL, 실시간 동기화, Google OAuth 내장 지원
- **RLS**: Row Level Security로 사용자별 데이터 격리
- **실시간**: 멀티디바이스 동기화 가능

#### 대안: Firebase (풀스택)
- **장점**: Google 생태계 완전 통합, Firestore, Auth
- **단점**: Vendor Lock-in, 비용 예측 어려움

## 📅 개발 단계별 계획

### Phase 1: 기반 구축 (1주)

#### Day 1-2: 백엔드 설정
```bash
# Supabase 프로젝트 생성
npx supabase init
npx supabase start

# 데이터베이스 스키마 설계
# users, credit_transactions, profiles 테이블
```

#### Day 3-4: Google OAuth 통합
```bash
# 필요 라이브러리 설치
npm install @supabase/supabase-js
npm install @google-cloud/oauth2

# Google Cloud Console 설정
# OAuth 2.0 클라이언트 ID 생성
```

#### Day 5-7: Frontend 통합
- `authStore` 구현
- 로그인/로그아웃 UI 추가
- 데이터 동기화 로직 구현

### Phase 2: 데이터 마이그레이션 (3일)

#### Day 8-9: 마이그레이션 로직
```typescript
class DataMigration {
  async migrateFromLocalStorage(userId: string) {
    const localData = localStorage.getItem('snu-credit-store')
    if (localData) {
      await this.uploadUserData(userId, JSON.parse(localData))
      await this.showMigrationSuccess()
    }
  }
  
  async handleDataConflict(localData: any, cloudData: any) {
    // 타임스탬프 비교 또는 사용자 선택
    return this.mergeData(localData, cloudData)
  }
}
```

#### Day 10: 오프라인 모드 구현
- 네트워크 상태 감지
- 로컬 변경사항 큐잉
- 온라인 시 자동 동기화

### Phase 3: 배포 및 최적화 (2일)

#### Day 11: 배포 설정
```yaml
# vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "runtime": "nodejs18.x"
    }
  },
  "env": {
    "GOOGLE_CLIENT_ID": "@google_client_id",
    "GOOGLE_CLIENT_SECRET": "@google_client_secret",
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_ANON_KEY": "@supabase_anon_key"
  }
}
```

#### Day 12: 성능 최적화
- 코드 스플리팅 (인증 관련 코드)
- 이미지 최적화 (구글 프로필 사진)
- 캐싱 전략 (API 응답)

## 🔧 구현 세부사항

### 1. 데이터베이스 스키마

```sql
-- Users 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Credit Transactions 테이블
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  bucket TEXT NOT NULL,
  credits DECIMAL(3,1) NOT NULL,
  course_name TEXT,
  major_type TEXT,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User Profiles 테이블
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dual_major_enabled BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Row Level Security 설정
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own transactions" ON credit_transactions
  FOR ALL USING (auth.uid() = user_id);
```

### 2. API 엔드포인트 설계

```typescript
// /api/auth/verify.ts
export default async function handler(req, res) {
  const { token } = req.body
  
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    })
    
    const payload = ticket.getPayload()
    const user = await createOrUpdateUser(payload)
    
    res.json({ success: true, user })
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// /api/user/data.ts
export default async function handler(req, res) {
  const user = await authenticateUser(req)
  
  if (req.method === 'GET') {
    const data = await getUserData(user.id)
    res.json(data)
  } else if (req.method === 'POST') {
    await saveUserData(user.id, req.body)
    res.json({ success: true })
  }
}
```

### 3. 프론트엔드 상태관리

```typescript
// authStore.ts
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async () => {
        set({ isLoading: true })
        try {
          const credential = await googleSignIn()
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: credential.idToken })
          })
          
          const { user } = await response.json()
          set({ user, isAuthenticated: true, isLoading: false })
          
          // 데이터 마이그레이션 확인
          await get().checkDataMigration()
        } catch (error) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        await googleSignOut()
        set({ user: null, isAuthenticated: false })
      },

      syncData: async () => {
        if (!get().isAuthenticated) return
        
        const localData = useCreditStore.getState()
        await fetch('/api/user/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localData)
        })
      }
    }),
    {
      name: 'snu-auth-store',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated })
    }
  )
)
```

## 🎯 배포 체크리스트

### 환경 설정
- [ ] Google Cloud Console OAuth 설정
- [ ] Supabase 프로젝트 생성 및 설정
- [ ] Vercel 환경변수 설정
- [ ] 도메인 및 SSL 인증서 설정

### 보안 검토
- [ ] CORS 설정 검토
- [ ] API 엔드포인트 보안 검증
- [ ] 토큰 만료 시간 설정
- [ ] RLS 정책 검증
- [ ] 민감한 정보 환경변수 분리

### 성능 최적화
- [ ] 번들 크기 분석 및 최적화
- [ ] 이미지 최적화 (Next.js Image 사용)
- [ ] API 응답 캐싱
- [ ] 코드 스플리팅 적용

### 사용자 경험
- [ ] 로딩 상태 UI 구현
- [ ] 에러 핸들링 및 사용자 피드백
- [ ] 오프라인 모드 안내
- [ ] 데이터 마이그레이션 가이드

### 테스트
- [ ] 로그인/로그아웃 플로우 테스트
- [ ] 데이터 동기화 테스트
- [ ] 오프라인/온라인 전환 테스트
- [ ] 다중 디바이스 동기화 테스트

## 📊 예상 비용 및 리소스

### 개발 리소스
- **개발 시간**: 약 12일 (풀타임 기준)
- **주요 작업**: Backend 설정 40%, Frontend 통합 35%, 테스트 및 최적화 25%

### 운영 비용 (월간)
- **Vercel Pro**: $20/월 (필요시)
- **Supabase Pro**: $25/월 (확장 시)
- **Google Cloud**: 무료 할당량 내 사용 예상
- **도메인**: $10-15/년

### 무료 티어 한계
- **Vercel**: 100GB 대역폭/월, 12개 서버리스 함수
- **Supabase**: 500MB 저장공간, 2GB 데이터 전송
- **Google OAuth**: 제한 없음

## 🚀 배포 실행 명령어

```bash
# 1. 환경 설정
cp .env.example .env.local
# 환경변수 설정 후

# 2. 의존성 설치
npm install --legacy-peer-deps
npm install @supabase/supabase-js @google-cloud/oauth2

# 3. Supabase 설정
npx supabase init
npx supabase db push

# 4. 개발 서버 실행
npm run dev

# 5. 빌드 및 배포
npm run build
npx vercel --prod
```

## 🔄 마이그레이션 시나리오

### 시나리오 1: 신규 사용자
1. 첫 방문 → 게스트 모드로 사용
2. 로그인 권유 → 구글 로그인
3. 빈 계정으로 시작

### 시나리오 2: 기존 사용자 (데이터 있음)
1. 로그인 → 로컬 데이터 감지
2. "기존 데이터를 클라우드에 백업하시겠습니까?" 확인
3. 마이그레이션 완료 → 멀티디바이스 동기화

### 시나리오 3: 다중 디바이스 사용자
1. 디바이스 A에서 로그인 → 데이터 업로드
2. 디바이스 B에서 로그인 → 클라우드 데이터 다운로드
3. 실시간 동기화 유지

## 📈 성능 목표

### 로딩 성능
- **초기 로딩**: <3초 (구글 로그인 포함)
- **로그인 프로세스**: <2초
- **데이터 동기화**: <1초

### 사용성 목표
- **로그인 완료까지**: <5클릭
- **데이터 마이그레이션**: 1클릭 + 자동화
- **오프라인 지원**: 100% 기능 유지

## 🛟 롤백 계획

### 문제 발생 시 대응
1. **즉시 롤백**: Vercel 이전 배포로 복구
2. **데이터 복구**: Supabase 백업에서 복구
3. **로컬 모드**: 구글 로그인 비활성화, 로컬 전용 모드 제공

### 점진적 배포
1. **Phase 1**: 구글 로그인 옵션 제공 (기존 기능 유지)
2. **Phase 2**: 데이터 동기화 기능 추가
3. **Phase 3**: 완전한 클라우드 통합

---

**배포 예상 완료일**: 개발 시작 후 2주
**유지보수 계획**: 월 1회 보안 업데이트, 분기별 기능 개선
**문의사항**: 개발팀 또는 이슈 트래커 활용