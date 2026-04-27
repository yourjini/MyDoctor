# MyDoctor

여러 병원 다니면서 받은 진료 · 검진 · 예약을 한 곳에서 관리하는 개인용 웹 앱.
데이터는 별도의 private GitHub 저장소(`MyDoctor_db`)에 JSON과 원본 파일로
커밋되어 자동으로 버전 관리됩니다.

## 기능

- **캘린더 대시보드** — 방문 이력과 예약을 월간 뷰로 한눈에
- **방문 이력** — 병원유형, 병원명, 의사, 병명, 상세, 영수증/처방전 이미지, 실비보험 청구 여부
- **예약 관리** — 다음 진료 일시 + 주의사항 (금식, 약 중단 등)
- **건강검진 이력** — PDF/이미지 업로드 → Claude API로 자동 요약 → 수정 + 의사소견 추가, 연도별 정리

## 스택

- Next.js 16 (App Router) + TypeScript + Tailwind
- Octokit — GitHub Contents API로 데이터 읽기/쓰기
- `@anthropic-ai/sdk` — Claude Opus 4.7 (adaptive thinking + structured output)로 검진 결과 자동 추출
- 단순 비밀번호 인증 (HMAC 쿠키)

## 데이터 구조 (`MyDoctor_db` 레포)

```
data/
  visits/<연도>/<uuid>.json
  visits/<연도>/<uuid>-files/<파일명>
  appointments/<연도>/<uuid>.json
  checkups/<연도>/<uuid>.json
  checkups/<연도>/<uuid>-files/<파일명>
```

각 변경은 GitHub 커밋이 되므로 모든 수정 이력이 자동 보존됩니다.

## 로컬 개발

```bash
npm install
cp .env.example .env.local
# .env.local 채우기 (아래 환경변수 참고)
npm run dev
```

`http://localhost:3000` 접속 → 로그인 페이지에서 `APP_PASSWORD` 입력.

## 환경변수

**필수 (4개):**

| 변수 | 설명 |
|---|---|
| `GITHUB_TOKEN` | 데이터 레포에 쓰기 권한이 있는 PAT (Contents: R/W) |
| `ANTHROPIC_API_KEY` | 검진 결과 자동 추출용 |
| `APP_PASSWORD` | 로그인 비밀번호 |
| `AUTH_SECRET` | 세션 쿠키 서명용 (16자 이상 랜덤) |

**선택 (기본값 `yourjini/MyDoctor_db@main` 사용):**
다른 데이터 레포 쓰고 싶으면 `GITHUB_DATA_OWNER`, `GITHUB_DATA_REPO`, `GITHUB_DATA_BRANCH` 추가 등록.

## 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourjini%2FMyDoctor&env=GITHUB_TOKEN,ANTHROPIC_API_KEY,APP_PASSWORD,AUTH_SECRET&envDescription=4%20required%20env%20vars%20-%20see%20MOBILE_SETUP.md&envLink=https%3A%2F%2Fgithub.com%2Fyourjini%2FMyDoctor%2Fblob%2Fmain%2FMOBILE_SETUP.md)

- **모바일에서 5분 셋업**: [MOBILE_SETUP.md](./MOBILE_SETUP.md)
- **터미널에서 이어할 때**: [HANDOFF.md](./HANDOFF.md)

> **주의**: 데이터 레포 (`MyDoctor_db`) 는 반드시 **private**으로 두세요. 의료 정보입니다.

## GitHub PAT 만들기

1. https://github.com/settings/personal-access-tokens/new
2. Repository access → Only select repositories → `MyDoctor_db` 선택
3. Repository permissions → Contents: **Read and write**
4. Token 생성 후 `GITHUB_TOKEN` 에 사용

## 사용 시나리오

- **병원 다녀온 직후**: 방문 이력에 병원 + 진단 + 영수증 사진 업로드
- **다음 진료 예약 잡힘**: 예약에 일시 + 주의사항 (금식, 보험증 챙기기 등) 메모
- **건강검진 결과지 받음**: PDF 업로드 → "AI 분석" 클릭 → 자동 요약 확인하고 수정 → 의사한테 들은 추가 설명 추가 → 저장
- **시간 지난 후 다시 보고 싶을 때**: 캘린더에서 날짜 클릭하거나, 연도별 목록에서 찾기
