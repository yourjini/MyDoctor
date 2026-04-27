# 작업 인수인계 (handoff)

이 문서는 채팅 세션 떠난 뒤 터미널에서 이어 작업하기 위한 메모입니다.

## 현재 상태

- **브랜치**: `claude/health-records-app-K1Mso`
- **PR**: https://github.com/yourjini/MyDoctor/pull/1
- **빌드**: 통과 (`npm run build` OK, `npx tsc --noEmit` clean)
- **배포**: 아직 안 함 — Vercel에서 직접 해야 함

## 만들어진 기능 (요약)

| 페이지 | 경로 | 비고 |
|---|---|---|
| 캘린더 대시보드 | `/` | 방문/예약 월간뷰, 다가오는 예약 + 최근 방문 |
| 방문 이력 | `/visits`, `/visits/new`, `/visits/[year]/[id]` | 병원유형/이름/의사/병명/상세, 영수증 업로드, 실비청구 체크 |
| 예약 | `/appointments`, `/appointments/new`, `/appointments/[year]/[id]` | 일시 + 주의사항 |
| 건강검진 | `/checkups`, `/checkups/new`, `/checkups/[year]/[id]` | PDF/이미지 업로드 → Claude Opus 4.7 자동 요약 → 수정 + 의사소견 추가 |
| 로그인 | `/login` | 단일 비밀번호, HMAC 쿠키 |

## 데이터 레포

- **별도 레포**: `yourjini/MyDoctor_db` (private)
- 코드에 기본값 박혀있음 (`src/lib/github.ts` `getRepo()`)
- 다른 레포로 바꾸려면 `GITHUB_DATA_OWNER` / `GITHUB_DATA_REPO` / `GITHUB_DATA_BRANCH` 환경변수 등록

데이터 구조:
```
data/
  visits/<연도>/<uuid>.json
  visits/<연도>/<uuid>-files/<파일명>
  appointments/<연도>/<uuid>.json
  checkups/<연도>/<uuid>.json
  checkups/<연도>/<uuid>-files/<파일명>
```

## 배포: 터미널에서 이어할 일

### 1. Vercel CLI 로그인 + 프로젝트 link

```bash
cd ~/path/to/MyDoctor
git fetch origin
git checkout claude/health-records-app-K1Mso

npm i -g vercel        # 또는 npx vercel
vercel login           # 브라우저로 인증
vercel link            # MyDoctor 프로젝트 연결 (없으면 새로 만듦)
```

### 2. 환경변수 등록 (4개만 필수)

```bash
# GitHub PAT — Contents: R/W on MyDoctor_db
vercel env add GITHUB_TOKEN production
vercel env add GITHUB_TOKEN preview
vercel env add GITHUB_TOKEN development

# Anthropic 키
vercel env add ANTHROPIC_API_KEY production
vercel env add ANTHROPIC_API_KEY preview

# 로그인 비밀번호 (직접 정해서 입력)
vercel env add APP_PASSWORD production
vercel env add APP_PASSWORD preview

# 세션 쿠키 서명용 — 아래 값 그대로 복붙해도 되고 새로 생성해도 됨
# openssl rand -hex 32
vercel env add AUTH_SECRET production
vercel env add AUTH_SECRET preview
```

**미리 생성해둔 AUTH_SECRET (그대로 사용 가능):**
```
0c114fa7899b054c88565bbcfcd8f7ddc573304206693e5b8ad10a303264a4b8
```

### 3. 배포

```bash
vercel --prod
```

또는 그냥 `main`에 머지하면 Vercel이 자동 배포함.

## GitHub PAT 만들기 (아직 안 했으면)

1. https://github.com/settings/personal-access-tokens/new
2. **Repository access** → Only select repositories → `MyDoctor_db`
3. **Repository permissions** → Contents: **Read and write**
4. **Generate token** → 한 번만 보여주는 토큰 즉시 복사해서 안전한 곳에 (Vercel env 입력용)

## 로컬 개발 확인

```bash
npm install
cp .env.example .env.local
# .env.local 채우기 (위 4개 변수)
npm run dev
```

`http://localhost:3000` → 로그인 → 동작 확인.

## 알려진 사항

- 로그인 미들웨어는 Edge runtime, Web Crypto 사용 (`src/middleware.ts`, `src/lib/auth.ts`)
- 첨부파일은 raw GitHub URL 노출 안 함 — 인증된 `/api/file/[...path]` 라우트로만 서빙
- AI 추출은 `claude-opus-4-7` + adaptive thinking + structured JSON output (`src/lib/extract.ts`)
- 첨부 업로드 size 한도: Server Actions 30MB (`next.config.ts`)

## 추가하면 좋을 것 (시간 날 때)

- 약 복용 관리 (4번 자리에 들어갈 수 있는 후보)
- 가족력
- 검진 결과 시계열 그래프 (혈압, 콜레스테롤 등)
- 알림 (다가오는 예약 24시간 전 등)
- iOS PWA 설정 (홈화면 추가)
