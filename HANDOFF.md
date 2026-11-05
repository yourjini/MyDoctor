# HANDOFF — 터미널에서 작업 이어가기

채팅 세션 떠난 뒤 터미널에서 이어 작업할 때 보는 메모.

> 최근 갱신: 2026-11-05

## 현재 상태

- **브랜치**: `main` = 작업 브랜치 `claude/inspiring-cannon-e3hevv` (`1681834` "SaveToast 자동 사라짐 수정")
- **원격**: 동기화 완료, unpushed 없음
- **프로덕션**: https://mydoctor-omega.vercel.app (main push → Vercel 자동 배포)
- **단계별 진행 요약**: [작업이력.md](./작업이력.md) — 최신은 13단계

### 지금 화면 구조 (요약)

- **홈**: 캘린더만. 날짜 빈 공간 탭 = 등록 모달(방문이력/예약), 일정 라벨 탭 = 상세
- **1차 탭**: 예약 / 방문이력 / 건강추적 (홈은 로고 클릭 → 대상 "전체" 리셋)
- **더보기**: 비공개(다이어리) · 기타(프로필, 관리자). 식단·생리주기·주의음식·
  선생님메모·리포트·조울모니터링은 `src/components/Nav.tsx` 에서 주석 처리로 숨김 (라우트는 살아있음)
- **대상자 선택**: 상단 PersonSwitcher 한 곳 (쿠키 기반). 페이지별 하단 필터·이름 뱃지 없음
- **예약 → 방문**: 예약 상세 "방문완료 / 비방문" 토글. 방문 → 예약 역전환도 가능
- **저장 후**: 하단 SaveToast (`?saved=...` 쿼리)

## 알려진 이슈 / 남은 일

### 성능 — 대부분 해결 ✅

- 리스트: `unstable_cache` + `data/<kind>/_index.json` 매니페스트 (N+1 제거)
- 저장: 매니페스트 sha 재사용 + 이미지 클라 압축 + 병렬 업로드
- 남은 병목: 서버 액션 안에서 첨부당 GitHub 커밋. 첨부가 많으면 여전히 수 초~수십 초.
  더 줄이려면 Git Trees API 로 한 커밋에 묶거나 스토리지 교체 (Postgres/Turso) 검토

### 주의할 점

- 매니페스트가 실제 파일과 어긋나 보이면 `/admin` → "모든 매니페스트 재구성"
- `next.config.ts` 의 `staleTimes` 0 은 필터 깜빡임 방지용 — 되돌리지 말 것
- `loading.tsx` 에 Nav 넣지 말 것 (상단바 중복 + 깜빡임 원인이었음)
- 예약 "되돌리기" 시 자동 생성된 Visit 는 삭제 안 됨 (의도된 동작, 수동 정리)

## 로컬 개발

```bash
cd ~/path/to/MyDoctor
git fetch origin
git checkout main

pnpm install
cp .env.example .env.local  # 아래 환경변수 참고 후 채우기
pnpm dev                 # http://localhost:3000
pnpm typecheck           # tsc --noEmit
pnpm build               # 배포 전 로컬 빌드 확인
```

## 환경변수 (필수 4개)

```bash
GITHUB_TOKEN=ghp_...               # MyDoctor_db Contents: R/W PAT
APP_PASSWORD=...                   # 메인 로그인
AUTH_SECRET=...                    # 16자 이상 랜덤 (openssl rand -hex 32)
DIARY_PASSWORD=...                 # /diary 2차 비번
# BLOB_READ_WRITE_TOKEN=...        # 로컬에서 큰 파일 업로드 테스트할 때만
```

Vercel 배포는 Dashboard → Environment Variables 에서 등록. Blob 스토어는 Storage 탭에서 Create → Connect.

## 배포 (수동 트리거)

```bash
# 보통은 main push 하면 Vercel 이 자동 배포
git push origin main

# Vercel CLI 쓰는 경우
vercel --prod
```

## 자주 쓰는 명령

```bash
git log --oneline -10                       # 최근 커밋 보기
git diff main~1 main                        # 직전 배포 diff
grep -rn "TODO\|FIXME" src/                 # 할일 찾기
npx tsc --noEmit                            # 타입체크만
pnpm build 2>&1 | tail -30               # 빌드 로그 끝부분
```

## 폴더 지도

| 경로 | 역할 |
|---|---|
| `src/app/<kind>/page.tsx` | 목록 |
| `src/app/<kind>/new/page.tsx` | 생성 폼 |
| `src/app/<kind>/[year]/[id]/page.tsx` | 상세/수정 |
| `src/app/<kind>/actions.ts` | Server Actions (create/update/delete) |
| `src/app/api/file/[...path]/route.ts` | 인증 거친 첨부파일 스트리밍 |
| `src/app/api/blob/upload/route.ts` | Vercel Blob 업로드 토큰 발급 |
| `src/lib/github.ts` | Octokit 저수준 R/W |
| `src/lib/store.ts` | 레코드 CRUD (github.ts 위) |
| `src/lib/auth.ts` | HMAC 쿠키 (앱 + 다이어리) |
| `src/lib/types.ts` | 모든 레코드 타입 |
| `src/lib/people.ts` | 가족 구성원 상수 + 필터 |
| `src/lib/kinds.ts` | 레코드 종류별 색상·라벨 |
| `src/lib/manifest.ts` | kind 별 `_index.json` 매니페스트 |
| `src/lib/use-blob-form.ts` | 첨부 업로드 공용 훅 (압축·병렬·서버 액션 호출) |
| `src/lib/image-compress.ts` | 클라 이미지 압축 |
| `src/lib/matching.ts` | 방문-예약 자동 매칭 |
| `src/lib/current-subject.ts` · `subject-action.ts` | 대상자 쿠키 읽기 / 변경 |
| `src/components/CalendarAddModal.tsx` | 캘린더 날짜 탭 등록 모달 |
| `src/app/admin/` | 매니페스트 재구성 · 방문-예약 자동 연결 |

## 다음에 손댈 때 체크리스트

- [ ] `.env.local` 있는지 (없으면 `.env.example` 복사)
- [ ] `pnpm install` 최신 lockfile 반영 (npm 쓰지 말 것 — package-lock.json 생기면 배포 실패)
- [ ] `pnpm dev` 뜨는지 확인
- [ ] 기능 추가 전 `작업이력.md` 끝에 새 단계 섹션 준비
- [ ] 작업 끝나면 커밋 메시지 한국어 요약
- [ ] main 에 push → Vercel 자동 배포 확인
- [ ] 데이터 모델 변경이면 기존 JSON과의 호환 확인 (field optional 처리)
