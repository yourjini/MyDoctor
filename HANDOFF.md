# HANDOFF — 터미널에서 작업 이어가기

채팅 세션 떠난 뒤 터미널에서 이어 작업할 때 보는 메모.

> 최근 갱신: 2026-10-04

## 현재 상태

- **브랜치**: `main` 과 `claude/health-records-app-K1Mso` 둘 다 `5d714ef` ("새 노트북 이전 전 로컬 작업 백업")
- **원격**: 동기화 완료, unpushed 없음
- **프로덕션**: https://mydoctor-omega.vercel.app (main push → Vercel 자동 배포)
- **단계별 진행 요약**: [작업이력.md](./작업이력.md)

## 알려진 이슈 (업데이트 예정)

### 성능 — 저장/조회 느림 ⚠️

**원인**: `src/lib/github.ts` 의 `listAllJSON` 이 디렉토리 재귀하면서 파일 하나당 `getContent` 호출을 하는 N+1 패턴.
`writeFile` 도 매번 SHA 조회 라운드트립 후 커밋.

대시보드/각 목록 페이지가 모든 레코드를 full-tree 로 긁어오므로, 레코드가 쌓일수록 선형적으로 느려짐.
GitHub Contents API 는 인증 기준 5000/hr 제한도 있어서 과하게 쓰면 429 가능.

**해결 후보 (가벼운 것부터)**:
1. Next.js `unstable_cache` + 레코드 종류별 태그 revalidation — 코드 변경 최소, 재배포만.
2. 각 레코드 종류별 `data/<kind>/_index.json` 매니페스트 유지 (리스트는 매니페스트만, 상세는 개별 파일) — 쓰기 1회 추가, 읽기 1회로 끝.
3. GitHub Contents API → GitHub Git Trees API (한 번에 트리 전체 받아오기) — 네트워크 1회로 감소.
4. 대안 스토리지 (Vercel Postgres / Turso) — 큰 리팩터, 지금 구조 바꿔야 함.

**추천 순서**: 2번부터. 1번은 보조.

### 디자인 — 메인 화면 지저분함

전문 UX/디자인 리뷰 필요. 쿠팡 수준의 레이아웃 지저분함 지적이 있음.
스크린샷·레퍼런스·우선순위 정해지면 재설계.

## 로컬 개발

```bash
cd ~/path/to/MyDoctor
git fetch origin
git checkout main   # 또는 claude/health-records-app-K1Mso

npm install
cp .env.example .env.local  # 아래 환경변수 참고 후 채우기
npm run dev                 # http://localhost:3000
npm run typecheck           # tsc --noEmit
npm run build               # 배포 전 로컬 빌드 확인
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
npm run build 2>&1 | tail -30               # 빌드 로그 끝부분
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

## 다음에 손댈 때 체크리스트

- [ ] `.env.local` 있는지 (없으면 `.env.example` 복사)
- [ ] `npm install` 최신 lockfile 반영
- [ ] `npm run dev` 뜨는지 확인
- [ ] 기능 추가 전 `작업이력.md` 끝에 새 단계 섹션 준비
- [ ] 작업 끝나면 커밋 메시지 한국어 요약
- [ ] main 에 push → Vercel 자동 배포 확인
- [ ] 데이터 모델 변경이면 기존 JSON과의 호환 확인 (field optional 처리)
