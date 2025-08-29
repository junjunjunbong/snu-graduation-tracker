# 🗄️ Supabase 데이터베이스 설정 가이드

## 1. Supabase 프로젝트 생성

### 1.1 계정 생성 및 프로젝트 설정
1. https://supabase.com 접속
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Project name**: `snu-graduation-tracker`
   - **Database Password**: 강력한 비밀번호 설정
   - **Region**: `Northeast Asia (Seoul)` 선택
4. "Create new project" 클릭

## 2. 데이터베이스 스키마 생성

### 2.1 SQL Editor로 스키마 적용
1. Supabase 대시보드 → **SQL Editor** 클릭
2. "New Query" 버튼 클릭
3. 아래 전체 SQL 코드를 복사해서 붙여넣기:

\`\`\`sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Credit transactions table
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  bucket TEXT NOT NULL,
  credits DECIMAL(3,1) NOT NULL CHECK (credits >= 0 AND credits <= 99.5),
  course_name TEXT,
  major_type TEXT CHECK (major_type IN ('주전공', '복수전공')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  dual_major_enabled BOOLEAN DEFAULT FALSE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_term ON credit_transactions(term);
CREATE INDEX idx_credit_transactions_bucket ON credit_transactions(bucket);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = google_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = google_id);

-- RLS Policies for credit_transactions table
CREATE POLICY "Users can view own transactions" ON credit_transactions
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE google_id = auth.uid()::text)
  );

CREATE POLICY "Users can insert own transactions" ON credit_transactions
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE google_id = auth.uid()::text)
  );

CREATE POLICY "Users can update own transactions" ON credit_transactions
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE google_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete own transactions" ON credit_transactions
  FOR DELETE USING (
    user_id IN (SELECT id FROM users WHERE google_id = auth.uid()::text)
  );

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE google_id = auth.uid()::text)
  );

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE google_id = auth.uid()::text)
  );

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE google_id = auth.uid()::text)
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credit_transactions_updated_at BEFORE UPDATE ON credit_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
\`\`\`

4. **"RUN"** 버튼 클릭하여 실행
5. 성공 메시지 확인

### 2.2 테이블 생성 확인
1. 좌측 메뉴에서 **Table Editor** 클릭
2. 다음 3개 테이블이 생성되었는지 확인:
   - ✅ `users`
   - ✅ `credit_transactions`  
   - ✅ `user_profiles`

## 3. Google OAuth 설정

### 3.1 Supabase Auth 설정
1. Supabase 대시보드 → **Authentication** → **Settings**
2. **Auth Providers** 탭으로 이동
3. **Google** 토글을 ON으로 변경
4. 아래 정보 입력 (Google Console에서 가져올 예정):
   - **Client ID**: (나중에 입력)
   - **Client Secret**: (나중에 입력)

### 3.2 Google Cloud Console 설정
1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성: "SNU Graduation Tracker"
3. **APIs & Services** → **OAuth consent screen**:
   - User Type: External
   - App name: SNU 졸업요건 트래커
   - User support email: 본인 이메일
   - Authorized domains: `supabase.co`

4. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Name: SNU Graduation Tracker
   - Authorized redirect URIs 추가:
     \`\`\`
     https://your-project-ref.supabase.co/auth/v1/callback
     \`\`\`
     (your-project-ref는 Supabase 프로젝트 URL에서 확인)

5. 생성된 **Client ID**와 **Client Secret**을 복사

### 3.3 Supabase에 Google OAuth 정보 입력
1. Supabase Authentication Settings로 돌아가기
2. Google Provider에 방금 복사한 정보 입력:
   - **Client ID**: 복사한 Google Client ID
   - **Client Secret**: 복사한 Google Client Secret
3. **Save** 클릭

## 4. 환경변수 설정

### 4.1 Supabase 프로젝트 정보 확인
1. Supabase 대시보드 → **Settings** → **API**
2. 다음 정보 복사:
   - **Project URL**: `https://abcdefgh.supabase.co`
   - **Project API keys** → **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4.2 로컬 환경변수 파일 생성
프로젝트 루트에 `.env.local` 파일 생성:

\`\`\`bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google OAuth Configuration  
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
\`\`\`

## 5. 테스트

### 5.1 로컬 개발 서버 실행
\`\`\`bash
npm run dev
\`\`\`

### 5.2 로그인 테스트
1. 브라우저에서 http://localhost:5173 접속
2. 우측 상단 "구글로 로그인" 버튼 클릭
3. Google OAuth 인증 진행
4. 성공 시 사용자 프로필 표시 확인

### 5.3 데이터 동기화 테스트
1. 로그인 후 졸업요건 데이터 입력
2. "동기화" 버튼 클릭
3. Supabase Table Editor에서 데이터 저장 확인

## 6. 배포 환경 설정

### 6.1 Vercel 환경변수 설정
\`\`\`bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY  
vercel env add VITE_GOOGLE_CLIENT_ID
\`\`\`

### 6.2 Google OAuth 리다이렉트 URL 추가
Google Cloud Console에서 배포 도메인도 추가:
\`\`\`
https://your-app.vercel.app/auth/callback
\`\`\`

## 🔧 문제 해결

### 로그인 안됨
- Google Client ID 확인
- 리다이렉트 URL 정확한지 확인
- Supabase Auth Provider 활성화 확인

### 데이터 동기화 실패
- Supabase 프로젝트 URL/Key 확인
- RLS 정책 제대로 생성되었는지 확인
- 브라우저 개발자 도구에서 에러 메시지 확인

### 테이블이 안 보임
- SQL 실행 시 에러가 없었는지 확인
- Extensions (uuid-ossp) 설치 확인
- 테이블 권한 설정 확인

---

이제 완전한 클라우드 기반 졸업요건 트래커를 사용할 수 있습니다! 🎉