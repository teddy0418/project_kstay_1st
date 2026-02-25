# 배포 순서 (KSTAY)

배포 전·배포 시·배포 후 순서로 정리한 체크리스트입니다.

---

## Push 순서 (로컬 수정 → 배포 반영)

로컬에서 수정한 뒤 Vercel 자동 배포까지 반영하는 기본 순서입니다.

```bash
cd c:\project_kstay_1st
git status
git add .
git commit -m "feat: 요약 메시지 (예: 인기숙소 Load more, 지도 항상 펼침, 라인/카카오 로그인 등)"
git push
```

| 단계 | 명령 | 설명 |
|------|------|------|
| 1 | `cd c:\project_kstay_1st` | 프로젝트 폴더로 이동 |
| 2 | `git status` | 수정·추가된 파일 확인 (선택) |
| 3 | `git add .` | 변경분 전부 스테이징 |
| 4 | `git commit -m "메시지"` | 커밋 생성 |
| 5 | `git push` | 원격(main)에 올리기 → Vercel 자동 배포 |

- 커밋 메시지는 `feat:`, `fix:`, `chore:` 등으로 시작하면 좋습니다.
- `git push` 후 Vercel 대시보드에서 빌드·배포 상태를 확인할 수 있습니다.

---

## 1. 배포 전 (로컬에서)

| 순서 | 작업 | 명령/확인 |
|------|------|-----------|
| 1 | 의존성 설치 | `npm install` |
| 2 | 타입 검사 | `npm run typecheck` |
| 3 | 린트 | `npm run lint` |
| 4 | 프로덕션 빌드 | `npm run build` |
| 5 | (선택) 보안 스캔 | `npm audit` |
| 6 | DB 마이그레이션 파일 확인 | `prisma migrate status` — 적용 안 된 migration이 있으면 다음 단계에서 적용 |

---

## 2. 배포 환경 준비

### 2-1. 환경 변수 설정 (Vercel/호스팅 대시보드)

**필수**

- `DATABASE_URL` — PostgreSQL 풀 URL (Vercel Postgres 등)
- `DATABASE_URL_UNPOOLED` — 마이그레이션/긴 트랜잭션용 직접 연결 URL
- `AUTH_SECRET` — `openssl rand -base64 32` 로 생성
- `AUTH_URL` 또는 `NEXTAUTH_URL` — 배포 URL (예: `https://도메인`)
- `NEXT_PUBLIC_SITE_URL` — 배포 URL (동일)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google 로그인
- `RESEND_API_KEY`, `EMAIL_FROM` — 예약 확정 메일
- `PAYMENT_PROVIDER` / `NEXT_PUBLIC_PAYMENT_PROVIDER` — `MOCK` 또는 `PORTONE`
- PortOne 사용 시: `PORTONE_STORE_ID`, `PORTONE_CHANNEL_KEY`, `PORTONE_API_SECRET`, `PORTONE_WEBHOOK_SECRET`
- (선택) `NEXT_PUBLIC_PORTONE_PAY_METHOD` — `CARD` | `EASY_PAY`

**선택 (기능별)**

- 카카오 로그인: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`(필요 시)
- 라인 로그인: `LINE_CLIENT_ID`, `LINE_CLIENT_SECRET`
- 관리자: `ADMIN_EMAILS` (쉼표 구분)
- Cron: `CRON_SECRET` — 예약 만료 등 크론 호출용
- 서류 S3: `DOCUMENT_STORAGE=s3`, `AWS_S3_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `DOCUMENT_STORAGE_PUBLIC_BASE_URL`

### 2-2. OAuth 리다이렉트 URI 등록

- Google / Kakao / Line 개발자 콘솔에  
  `https://(배포도메인)/api/auth/callback/google` (및 kakao, line) 등록

---

## 3. 배포 시 (순서 지키기)

| 순서 | 작업 | 설명 |
|------|------|------|
| 1 | **DB 마이그레이션 적용** | 배포 서버/CI에서 **앱 구동 전에** 실행 |
| 2 | **앱 빌드·배포** | Vercel push 시 자동이면, 마이그레이션은 Vercel 빌드 전 스텝 또는 수동 1회 실행 |

### 3-1. 마이그레이션 실행 (운영 DB에 1회 또는 배포마다)

배포 환경에서 DB 접속 가능한 곳에서:

```bash
# 환경 변수(DATABASE_URL_UNPOOLED 또는 DATABASE_URL) 로드 후
npx prisma migrate deploy
```

- Vercel: Build Command 전에 실행하려면 훅/스크립트로 `prisma migrate deploy` 호출하거나,  
  Vercel Postgres 사용 시 프로젝트 설정에서 마이그레이션 단계 추가.
- 최초 배포 시 DB가 비어 있지 않으면 `prisma-baseline-plan.md` 참고해 baseline 후 `migrate deploy`.

### 3-2. 앱 배포

- **Vercel:** `main`에 push → 자동 빌드·배포 (이미 연동된 경우).
- **수동:**  
  `npm run build` → `npm run start` (또는 호스팅의 Node 실행 방식에 맞게).

---

## 4. 배포 후 확인

| 순서 | 확인 항목 |
|------|-----------|
| 1 | `https://(도메인)/api/health/db` — `{ "ok": true }` |
| 2 | 로그인 (Google 등) 동작 |
| 3 | 결제 플로우 (테스트 결제 등) |
| 4 | 예약 확정 메일 발송 |
| 5 | (PWA) `/manifest.webmanifest`, `/sw.js` 200 응답 |

---

## 요약: 한 줄 순서

1. **로컬:** `npm install` → `npm run typecheck` → `npm run lint` → `npm run build`  
2. **환경 변수·OAuth URI** 설정  
3. **운영 DB:** `npx prisma migrate deploy`  
4. **앱 배포** (push 또는 수동 build/start)  
5. **헬스·로그인·결제·메일** 점검  
