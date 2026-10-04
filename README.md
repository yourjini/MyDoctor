# MyDoctor

가족 건강 기록을 한 곳에서 관리하는 개인용 웹 앱.
**박범진 · 박란하 · 최진희** 가족의 병원 이력부터 양극성 추적, 식단, 생리주기, 다이어리까지.
데이터는 별도 private GitHub 저장소(`MyDoctor_db`)에 JSON과 원본 파일로 커밋되어 자동 버전 관리됩니다.

**프로덕션**: https://mydoctor-omega.vercel.app

## 기능

### 의료 기록
- **방문이력** `/visits` — 병원 유형/이름, 의사, 병명, 상세, 영수증·처방전 첨부, 실비청구 체크
- **예약** `/appointments` — 일시 + 주의사항 (금식, 약 중단 등)
- **건강검진** `/checkups` — PDF/이미지 업로드 (HEIC 자동 변환, 큰 파일은 Vercel Blob 경유), 요약·소견·의사 코멘트
- **선생님메모** `/notes` — 다음 진료 때 전달할 체크리스트 (대기/전달함)
- **건강일지** `/conditions` — 부위별 질환 트래커, 검사 기록 누적 (추적중/검사필요/치료중/해결됨)

### 일상 건강 추적
- **데일리리포트** `/health` — 태그 기반 일일 기록 (신체·기분·수면)
  - 박란하 양극성 추적: 기분 스케일 -5~+5, 수면시간, 조증·우울 신호, 출결, 체중
  - 캘린더 보기 + 그래프 보기(`/health/chart`)로 추이 확인
- **식단** `/meals` — 음식 라이브러리 기반 끼니 기록
- **생리주기** `/period` — 박란하·최진희
- **주의음식** `/cautions` — 약물과 상호작용하는 음식·음료·약물 (박란하 약물 기반 시드 9건)

### 비공개
- **다이어리** `/diary` — 앱 로그인 위에 **별도 비번(`DIARY_PASSWORD`)** 으로 한 번 더 잠그는 부모 전용 비공개 노트. 7일 유지.

### 공통
- **캘린더 대시보드** `/` — 방문/예약 월간 뷰 + 최근 기록
- **프로필** `/profile` — 가족 구성원 기본 정보 (활동량 등)
- **대상자 필터** — 모든 목록에서 가족 구성원별로 필터 (전체/박범진/박란하/최진희)

## 스택

- **Next.js 16** (App Router, Server Actions) + TypeScript + Tailwind
- **Octokit** — GitHub Contents API 로 데이터 읽기/쓰기 (레코드 = JSON 커밋)
- **@vercel/blob** — 4.5MB 넘는 첨부파일 우회 업로드
- **pdfjs-dist** — PDF 미리보기 (worker 자체 호스팅)
- **heic-convert** — iPhone HEIC → JPEG 자동 변환
- **recharts** — 바이오리듬·추이 그래프
- **단순 비밀번호 인증** — Edge 호환 HMAC 쿠키 (앱 전체) + 2차 비번 (다이어리)

## 데이터 구조 (`MyDoctor_db` 레포)

```
data/
  visits/<연도>/<uuid>.json
  visits/<연도>/<uuid>-files/<파일명>
  appointments/<연도>/<uuid>.json
  checkups/<연도>/<uuid>.json
  checkups/<연도>/<uuid>-files/<파일명>
  health/<연도>/<uuid>.json          # 데일리리포트
  period/<연도>/<uuid>.json
  meals/<연도>/<월>/<uuid>.json
  diary/<연도>/<uuid>.json
  cautions/<uuid>.json                # 플랫 (연도 분할 없음)
  notes/<uuid>.json                   # 플랫
  conditions/<uuid>.json              # 플랫
  conditions/<uuid>/exams/<uuid>.json # 검사 누적
  profiles/<구성원>.json
```

모든 변경은 GitHub 커밋이 되므로 수정 이력이 자동 보존됩니다.

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
| `GITHUB_TOKEN` | 데이터 레포에 쓰기 권한 있는 PAT (Contents: R/W) |
| `APP_PASSWORD` | 메인 로그인 비밀번호 |
| `AUTH_SECRET` | 세션 쿠키 서명용 (16자 이상 랜덤) |
| `DIARY_PASSWORD` | `/diary` 2차 비밀번호 |

**Vercel 자동 주입 (로컬만 수동):**
- `BLOB_READ_WRITE_TOKEN` — Vercel 대시보드에서 Blob 스토어 연결 시 production엔 자동. 로컬에서 `/checkups` 큰 파일 업로드 테스트하려면 수동으로 넣어야 함.

**선택 (기본값 `yourjini/MyDoctor_db@main` 사용):**
- `GITHUB_DATA_OWNER`, `GITHUB_DATA_REPO`, `GITHUB_DATA_BRANCH`

## 배포

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourjini%2FMyDoctor&env=GITHUB_TOKEN,APP_PASSWORD,AUTH_SECRET,DIARY_PASSWORD&envDescription=4%20required%20env%20vars%20-%20see%20MOBILE_SETUP.md&envLink=https%3A%2F%2Fgithub.com%2Fyourjini%2FMyDoctor%2Fblob%2Fmain%2FMOBILE_SETUP.md)

- **모바일 5분 셋업**: [MOBILE_SETUP.md](./MOBILE_SETUP.md)
- **단계별 작업이력**: [작업이력.md](./작업이력.md) — 어디까지 왔는지 요약
- **터미널에서 이어할 때**: [HANDOFF.md](./HANDOFF.md)

> **주의**: 데이터 레포 (`MyDoctor_db`) 는 반드시 **private**으로 두세요. 의료 정보입니다.

## GitHub PAT 만들기

1. https://github.com/settings/personal-access-tokens/new
2. **Repository access** → Only select repositories → `MyDoctor_db`
3. **Repository permissions** → Contents: **Read and write**
4. 토큰 생성 후 `GITHUB_TOKEN` 에 사용

## 사용 시나리오

- **병원 다녀온 직후**: `/visits` 에 병원·진단·영수증 사진, `/notes` 에 다음 진료 때 물어볼 거 추가
- **다음 진료 예약**: `/appointments` 에 일시 + 주의사항
- **매일 저녁**: `/health` 에 그날 기분·수면·몸 상태 태그로 기록 (박란하는 양극성 상세 추적)
- **검진 결과지 받음**: `/checkups` 에 PDF 업로드 → 요약·의사 소견 메모
- **약 처방 변경**: `/cautions` 에서 상호작용 식품 재확인
- **일상 메모**: `/diary` (부모 전용, 2차 비번)
