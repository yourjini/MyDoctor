# 모바일에서 셋업하기 (5분)

PC 없이 폰만 들고도 배포 가능합니다. 모든 단계가 모바일 브라우저에서 됩니다.

---

## 0. 사전 준비물 (앱 다 안 깔아도 됨, 브라우저면 됨)

- **GitHub 계정** (mobile.github.com 또는 앱)
- **Vercel 계정** (vercel.com에서 GitHub로 가입 — 30초)

---

## 1단계 · 데이터 레포 만들기 (1분)

GitHub 모바일 → 우측 상단 `+` → **New repository**

| 항목 | 값 |
|---|---|
| Repository name | `MyDoctor_db` |
| Visibility | **Private** (꼭) |
| Initialize with README | 체크 |

→ **Create repository**

> 이미 만드셨으면 다음 단계로.

---

## 2단계 · GitHub PAT 발급 (1분)

브라우저에서: https://github.com/settings/personal-access-tokens/new

| 항목 | 입력 |
|---|---|
| Token name | `MyDoctor app` |
| Expiration | 90 days (또는 원하는 만큼) |
| Repository access | **Only select repositories** → `MyDoctor_db` 선택 |
| Repository permissions → **Contents** | **Read and write** |

→ **Generate token** → 화면에 한 번만 뜨는 토큰을 **즉시 복사** → 메모 앱에 잠깐 저장.

---

## 3단계 · Vercel에서 import (2분)

브라우저에서: https://vercel.com/new

1. **Import Git Repository** 섹션에서 `MyDoctor` 찾아 **Import**
2. **Application Preset** → 자동으로 **Next.js** 인지 확인 (꼭)
3. **Environment Variables** 펼치기 → 아래 4개 등록 (`+ Add More` 로 한 줄씩)

| Key | Value |
|---|---|
| `GITHUB_TOKEN` | 2단계에서 복사한 PAT |
| `APP_PASSWORD` | 원하는 메인 로그인 비밀번호 (아무거나) |
| `AUTH_SECRET` | 16자 이상 랜덤 문자열 (예: `0c114fa7899b054c88565bbcfcd8f7ddc573304206693e5b8ad10a303264a4b8`) |
| `DIARY_PASSWORD` | `/diary` 2차 비밀번호 (앱 비밀번호와 다른 걸 추천) |

> **본인 계정이 아닌 fork**라면 추가로:
> - `GITHUB_DATA_OWNER` → 본인 GitHub 사용자명
> - `GITHUB_DATA_REPO` → `MyDoctor_db`

4. **Deploy** → 1~2분 대기

---

## 4단계 · Blob 스토어 연결 (첨부파일 업로드용, 1분)

`/checkups` 에 4.5MB 넘는 PDF/이미지를 올리려면 Vercel Blob이 필요합니다.

Vercel 프로젝트 → **Storage** 탭 → **Create Database** → **Blob** 선택 → 생성 → **Connect to Project** → 환경변수 `BLOB_READ_WRITE_TOKEN` 가 자동 주입됨 → **Redeploy** (Deployments 탭).

> 이걸 안 하면 큰 파일 업로드 시 500 에러가 납니다. 작은 파일(<4.5MB)만 쓸 거면 건너뛰어도 됨.

---

## 5단계 · 접속 + 메모앱 비우기

- 발급된 `https://...vercel.app` 주소 접속
- 3단계 `APP_PASSWORD` 로 로그인
- `/diary` 들어가면 `DIARY_PASSWORD` 추가로 물어봄
- 작동 확인되면 **메모 앱에 저장한 PAT 삭제**

---

## 자주 막히는 곳

**Q. Build failed: `process.env.X is undefined`**
→ Vercel 프로젝트 Settings → Environment Variables에서 4개 다 들어갔는지 확인. 빠진 거 채우고 Deployments 탭에서 **Redeploy**.

**Q. 로그인 후 아무 페이지나 들어가면 GitHub 401 에러**
→ `GITHUB_TOKEN` 권한이 부족하거나 만료. 2단계 다시 가서 새 토큰 발급 → Vercel env에 업데이트 → Redeploy.

**Q. `/checkups` 에서 큰 파일 업로드 시 500 에러**
→ 4단계 Blob 스토어가 연결 안 됐거나 Redeploy 안 함. Storage 탭 확인 + Redeploy.

**Q. 데이터 레포 다른 이름으로 만들었는데**
→ Vercel env에 `GITHUB_DATA_OWNER` + `GITHUB_DATA_REPO` 추가.
