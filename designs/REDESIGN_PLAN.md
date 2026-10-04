# 메인 화면 재설계 제안

> 출처: Plan 서브에이전트 (2026-10-04). UX 리뷰 → IA/네비 변경 → 와이어프레임 → 구현 PR 분해.

## 1. 현재 상태 분석

**A. 인물 필터가 두 개, 서로 안 맞음**
`Nav.tsx:216` 의 `PersonSwitcher` (범진/란하/진희, 쿠키) 와 `DashboardView.tsx:62` 의 `ClientSubjectFilter` (전체/범진/란하/진희, useState) 가 공존. 로컬 pill 을 탭하면 상단 Nav 는 그대로 → "지금 누구를 보고 있는지" 가 화면 두 곳에 다르게 표시. "전체" 는 로컬에만 존재.

**B. Sitemap 이 Nav 와 완전 중복**
`DashboardView.tsx:160` `SITEMAP_GROUPS` 가 `Nav.tsx:33` `SECONDARY_GROUPS` + PRIMARY 를 그대로 복제. 하단탭 + 햄버거 + 홈 하단 Sitemap, 세 곳에서 같은 12개 링크 노출.

**C. 색상 과부하 (한 화면 7색, 모두 같은 채도)**
LanhaTodayCard: pink 아바타 + rose "+일지" + 타일 amber/rose/emerald/indigo. QuickActions: solid rose+emerald+emerald+amber. 다가오는 일정: pink/blue/emerald SubjectBadge + amber KindChip. 캘린더: emerald+amber legend. 어느 것도 "주인공" 이 아님 → 시각 우선순위 없음.

**D. 제목 "오늘" vs 실제 내용 불일치 (`page.tsx:97`)**
H1 "오늘" 인데 콘텐츠의 60% 는 교차시점 (upcoming, 월간 캘린더, Sitemap). "오늘" 섹션은 LanhaTodayCard 하나. 란하 외 인물 선택 시 "오늘" 콘텐츠 0건.

**E. 가장 빈번한 CTA (란하 저녁 일지) 가 2번 중복**
LanhaTodayCard 우상단 `+ 일지` (rose, `px-2.5 py-1 text-xs`, `LanhaTodayCard.tsx:30`) + 바로 아래 QuickActions `+ 데일리리포트` (rose, `min-h-[60px]`, `QuickActions.tsx:8`). 50px 간격, 같은 라우트, 다른 스타일.

**F. 모바일 터치타겟 44px 미만 다수**
- 로컬 필터 pill (`DashboardView.tsx:148`) `py-1 text-xs` ≈24px
- `PersonSwitcher` pill (`PersonSwitcher.tsx:46`) ≈24px
- `+ 새 예약` (`DashboardView.tsx:75`) ≈24px
- Sitemap 행 (`DashboardView.tsx:203`) `py-1.5` ≈32px
- 란하카드 타일은 non-interactive — shortcut 기회 상실

**G. 캘린더가 모바일에서도 기본 펼침**
`page.tsx:118` 에서 `defaultOpen={true}` 하드코딩. 컴포넌트 주석 ("mobile 은 접힘") 과 반대. 390×844 뷰포트에서 캘린더 그리드가 ~360px 세로를 차지, 란하카드 바로 아래 QuickActions 를 fold 아래로 밀어냄.

**H. 섹션 수직 순서가 사용 빈도와 안 맞음**
현재: 필터 → 란하카드 → QuickActions → 다가오는일정 → 캘린더 → Sitemap. 저녁 체크의 핵심인 "다음 예약 임박" 과 "오늘 일지 아직 안 썼음" 신호가 캘린더보다 위에 있어야 하는데, QuickActions 가 사이에 끼어 흐름을 끊음.

## 2. IA / 네비 변경 제안

**유지**: 1차 5탭 (오늘/데일리리포트/건강일지/방문이력/더보기), SECONDARY 3그룹 구조.

**이동**:
- `/diary` 는 "데일리리포트" 그룹 → "기타" 그룹 (부모 비공개, health 와 성격 다름).
- `/health/chart` 는 더보기 → `/health` 페이지 내 탭으로 흡수 (더보기 간소화).

**추가**:
- `PersonSwitcher` 에 "전체" 포함 (4개). 모든 페이지가 쿠키 하나로 동기.

**제거**:
- `DashboardView.tsx` 의 `ClientSubjectFilter` 삭제 (PersonSwitcher 로 통합).
- `DashboardView.tsx` 의 `Sitemap()` + `SITEMAP_GROUPS` 삭제 (햄버거/더보기로 충분).

## 3. 메인 화면 재구조안

모바일 (390px) 와이어프레임:

```
┌─────────────────────────────────┐
│ MyDoctor                   [≡]  │ Nav
│ 보는사람 [전체][범진][란하*][진희]│ PersonSwitcher 44px, 유일한 필터
├─────────────────────────────────┤
│ 오늘                            │ H1
│ 10월 4일 일요일 · 란하           │ 서브헤더 (선택 인물)
│                                 │
│ ╭─ 오늘의 란하 ──────────────╮  │ rose(health) 섹션
│ │  기분  +1    수면 7h       │  │ 타일 각각 /health/new?field=X
│ │  체중  51.2kg (+0.4)       │  │ 로 라우팅 (shortcut)
│ │ ┌─────────────────────────┐│  │
│ │ │ + 오늘 일지 기록하기     ││  │ full-width, min-h 56px
│ │ └─────────────────────────┘│  │ (유일한 primary CTA)
│ ╰────────────────────────────╯  │
│                                 │
│ 다가오는 일정 (3)      [+ 예약] │ amber(appointment) 섹션
│ ● 란하 10/6 09:00 서울대병원    │ min-h 56px, KindChip 제거
│ ● 범진 10/8 14:00 치과          │ (섹션 자체가 kind 식별)
│ ● 란하 10/12 10:00 정신과       │
│ [전체 보기 →]                    │
│                                 │
│ 빠른 입력                       │ secondary, outline+dot
│ [· 식사] [· 방문] [· 검진]      │ 톤 다운, 2x2 grid 유지
│                                 │
│ 캘린더   [이번달 5건]       [▼]│ 기본 접힘(모바일)
└─────────────────────────────────┘
         [하단탭 바 (sticky)]
```

데스크탑 (≥sm): 2열. 좌 2/3 = 란하카드+예약+빠른입력, 우 1/3 = 캘린더 (기본 펼침).

**섹션 우선순위 근거**
1. **PersonSwitcher 1개 (최상단)**: 두 필터 불일치가 가장 큰 혼란. 전체 포함해서 범용.
2. **"오늘의 X 카드 + 하나의 primary CTA"**: 매일 저녁 사용 패턴 (란하 저녁 일지) 에 한 번의 탭 거리. "+ 일지" 중복 제거.
3. **다가오는 일정 > 캘린더**: 저녁 체크 시 "다음 뭐 하지" 는 리스트 3행이 캘린더 그리드보다 빠름.
4. **QuickActions 톤 다운**: primary CTA 가 란하카드로 승격됐으므로 secondary 로 격하. solid 4색 → outline + kind dot. 란하 외 인물일 땐 데일리리포트 Primary 로 복원.
5. **Sitemap 제거**: 햄버거 메뉴로 충분.
6. **"전체" 선택 시**: 란하카드 숨김 (이미 적용) 대신 `FamilyTodaySummary` 3행 미니 리스트.

## 4. 디자인 원칙

**재사용 가능**
- `KIND_STYLES` (kinds.ts): 그대로. 단 **섹션당 1 kind 색 규칙** 신설. 섹션 내부는 중립.
- `PERSON_COLORS` (people.ts): 그대로. pill 사이즈만 `px-3 py-2 text-sm min-h-11` 로 통일.

**새 규칙**
- Accent color budget: 섹션당 1개. 란하카드=rose, 예약=amber, 캘린더=중립, QuickActions=중립+kind dot.
- `SubjectBadge` 점은 리스트 행 왼쪽 "식별자" 역할만. 배경 pill 로 쓰지 않음.

**타이포**
- H1 `text-xl sm:text-2xl` 유지. 날짜 서브헤더 `text-sm text-muted-foreground` 신규.
- 섹션 제목 `text-sm` → `text-base font-semibold` 로 승격.
- 메타 `text-xs text-muted-foreground` 유지.

**간격 / 터치**
- 섹션 간 `space-y-5` (현재 4 → 5).
- 모든 interactive `min-h-11` 강제.

## 5. 구현 계획 (PR 분해)

**PR 1 — 필터 통합** (혼란의 뿌리)
- `PersonSwitcher.tsx`: "전체" 를 `SELECTABLE` 에 추가, pill `min-h-11`.
- `DashboardView.tsx`: `ClientSubjectFilter` 함수 + 로컬 `subject` state 삭제. `subject = initialSubject` prop 만 사용.
- `page.tsx`: 변경 없음 (이미 `currentSubject` 쿠키 사용).

**PR 2 — Sitemap 제거 + 섹션 재정렬**
- `DashboardView.tsx`: `Sitemap`, `SITEMAP_GROUPS` 삭제.
- 섹션 순서: 란하카드 → 다가오는일정 → QuickActions → CollapsibleCalendar.
- `page.tsx:118` `defaultOpen` 로직을 `useMediaQuery` 또는 CSS-only 접근 (details/summary) 로.

**PR 3 — 란하카드 CTA 승격**
- `LanhaTodayCard.tsx`: 우상단 "+ 일지" 제거. 카드 하단 full-width `+ 오늘 일지 기록하기` 블록 버튼 (`min-h-14 text-base`).
- 타일 3개를 `<Link href="/health/new?field=mood|sleep|weight">` 로 shortcut 라우팅.

**PR 4 — QuickActions 톤 다운**
- `QuickActions.tsx`: solid 배경 제거, outline + 좌측 kind dot. 데일리리포트 타일은 조건부 (subject !== 박란하 일 때만 primary).

**PR 5 — "오늘" 서브헤더 + 가족 요약**
- `DashboardView.tsx`: H1 아래 "10월 4일 일요일 · {인물}" 서브헤더.
- 신규 `FamilyTodaySummary.tsx`: `subject === "전체"` 일 때 란하카드 대신 가족 3행 (각자 최근 health 날짜 + 다음 예약).

**PR 6 — 터치타겟 전수 점검**
- `PersonSwitcher`, 모든 섹션 "+" 보조 버튼, 리스트 "더보기" 링크 모두 `min-h-11`.

## 6. 열린 질문

1. **"전체" 선택 시 상단에 무엇을?** (a) 가족 3명 요약 3행, (b) 란하카드 유지(기본), (c) "오늘 기록 아직" 알림. 재설계는 (a) 전제.
2. **QuickActions 유지 vs 단일 CTA?** 란하 저녁 입력 90% 라면 QuickActions 전체 제거하고 Nav 로만.
3. **"다가오는 일정" vs "캘린더" 중 저녁 사용 빈도가 더 높은 쪽?** 답에 따라 캘린더 기본 펼침/접힘 반전.
4. **"데일리리포트" vs "건강일지" 라벨 혼동이 실제로 발생?** 발생 시 `/conditions` 를 "질환 트래커" 로 리네이밍.
5. **`/diary` 배치**: "기타" 로 이동 OK? 아니면 1차 노출?

---

## 다음 단계

- 열린 질문 1~5 사용자 응답 → 재설계안 확정
- HTML/CSS 프로토타입 생성 (모바일 뷰포트, 폰에서 바로 열람 가능)
- 승인 후 PR 1~6 순차 구현
