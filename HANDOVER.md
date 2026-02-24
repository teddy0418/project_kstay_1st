# KSTAY 프로젝트 인수인계 문서

> **목적:** AI(챗GPT 등) 또는 새 팀원이 이어받을 때 필요한 핵심 정보 정리.  
> **기준일:** 2026-02-22

---

## 1. 플랫폼 정의

| 항목 | 내용 |
|------|------|
| **이름** | KSTAY |
| **한 줄 정의** | 글로벌 타겟 한국 감성 숙소 예약 플랫폼. "Best Value" 강조. |
| **핵심 가치** | 게스트 수수료 12%, 호스트 수수료 0%, 정부인증 숙소 신뢰성 |
| **타겟** | 한국 방문 예정 외국인 + 국내 게스트 (ko/en/ja/zh 지원) |
| **차별점** | Tax & Service Fee 포함 가격, No Surprise Fees, 즉시 결제·24h 호스트 거절 모델 |

---

## 2. 기술 스택

| 구분 | 기술 |
|------|------|
| **프레임워크** | Next.js 16 (App Router), React 19 |
| **언어** | TypeScript |
| **스타일** | Tailwind CSS 4 |
| **DB/ORM** | Prisma + PostgreSQL |
| **인증** | NextAuth 4 (Google, Kakao, LINE) |
| **결제** | PortOne (포트원) |
| **국제화** | ko / en / ja / zh — `getServerLang()`, `useI18n()`, `src/locales/*.json`, `src/lib/i18n.ts` |
| **통화/환율** | USD·JPY·CNY·KRW, Frankfurter API (`/api/exchange`) |
| **기타** | Framer Motion, Lucide React, Leaflet(지도), Serwist(PWA) |

**로컬 실행**
```bash
cd c:\project_kstay_1st
npm run dev    # 포트 3001
npm run build  # 빌드 확인
```

---

## 3. 핵심 정책 (코드 반영됨)

| 항목 | 값 | 비고 |
|------|-----|------|
| 게스트 수수료 | 12% | `src/lib/policy.ts` `GUEST_SERVICE_FEE_NET_RATE = 0.12` |
| 호스트 수수료 | 0% | `HOST_FEE_RATE = 0` |
| 무료 취소 | 체크인 7일 전 23:59 KST까지 | `FREE_CANCELLATION_DAYS = 7` |
| 호스트 거절 | 결제 후 24h 이내 거절 가능, 이후 void/환불 | `HOST_DECISION_HOURS = 24` |
| 시간대 | KST (Asia/Seoul) | 정산·취소 기준 |

---

## 4. 현재 구현된 기능 요약

- **홈/탐색**: 인기 목적지(서울·부산·제주 등), Top Recommended Stays, 검색(Where/When/Who)
- **리스팅 상세**: 갤러리, 호스트 프로필(정부인증숙소 배지), 부대시설, 위치 카드(지도 iframe), 리뷰 섹션, BookingWidget
- **체크아웃**: 베이스 + 12% 수수료 표시, PortOne 결제
- **인증**: Google / Kakao / LINE 로그인, 로그아웃 정상 동작
- **프로필**: 프로필 사진 클릭 업로드(JPEG/PNG/WebP, 5MB, 200×200~2048×2048, 1:1 크롭), 카메라 아이콘 배지
- **가격/환율**: 선택 통화로 표시, 실시간 환율 적용
- **보드**: Food & Travel Tips 포토 보드
- **호스트/어드민**: 대시보드, 예약 테이블, 정산(Ready/Hold)

---

## 5. 최근 변경 사항 (이번 세션에서 반영된 것)

1. **리스팅 상세 - 호스트 배지**
   - "0% Host Fee" → "정부인증숙소" (4개 언어 지원)
   - 검은 배경 + 우측 파란 ShieldCheck 아이콘

2. **리스팅 상세 - 지도 섹션 정리**
   - 좌측 Location 섹션(주소 + View map 버튼) 제거
   - 사진 아래 3카드의 Location 카드(iframe 포함)만 유지

3. **리스팅 상세 - Location 카드 정렬**
   - `items-center` → `items-start`로 Location 제목 정렬 조정

4. **프로필 페이지 - 사진 업로드**
   - Photo URL 입력 제거
   - 프로필 원형 클릭 → 파일 선택(웹: 파일 탐색, 모바일: 사진첩)
   - 프로필 우측 하단 카메라 아이콘(흰 배경, 회색 아이콘)으로 변경 가능 표시
   - 검증: JPEG/PNG/WebP, 5MB, 200×2048px, 1:1 크롭 후 400×400 저장
   - `document.createElement("img")` 사용 (Next.js Image와 충돌 방지)

---

## 6. 주요 파일/경로

| 경로 | 역할 |
|------|------|
| `src/app/(guest)/page.tsx` | 홈 |
| `src/app/(guest)/listings/[id]/page.tsx` | 리스팅 상세 |
| `src/app/(guest)/profile/page.tsx` | 프로필 (사진 업로드 포함) |
| `src/app/(guest)/checkout/page.tsx` | 체크아웃 |
| `src/lib/policy.ts` | 수수료·취소 정책 |
| `src/lib/i18n.ts`, `src/lib/i18n/server.ts` | 언어 감지(쿠키, Accept-Language) |
| `src/locales/*.json` | 번역 키 |
| `PROJECT_STATUS.md` | 상세 기능·파일 구조 |

---

## 7. 환경 변수 (배포 시)

- `DATABASE_URL` — Prisma용 DB 연결
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL` — 인증
- `KAKAO_CLIENT_ID`, `LINE_CLIENT_ID`, `LINE_CLIENT_SECRET` — 소셜 로그인
- PortOne 관련 변수 (결제 연동 시)

---

## 8. 다음 단계 (우선순위)

1. 인증·DB 연동: 계정별 서버 저장, Wishlist/예약 연동
2. 결제: PortOne 실제 연동, `pg_tid` 저장
3. 정산: 화요일 정산 규칙, `settlement_id` 발급
4. 디버그 로그 제거

---

## 9. AI에게 요청할 때 참고

- **언어**: 프로필/리스팅 등 UI는 `getServerLang()` 또는 `useI18n()` 기반 ko/en/ja/zh 지원 필요
- **이미지**: `next/image`는 일부 제거됨, `<img>` 사용 구간 있음
- **검색바**: `FloatingSearchWrapper`로 pathname에 따라 노출 구간 제어
- **가격**: `formatDualPriceFromKRW`, `ExchangeRatesProvider` 사용

---

## 10. 숙소등록 기반 작업 (실 서비스 대비)

숙소등록 폼 UI를 완성하기 전에 아래를 먼저 진행하면 재작업을 줄일 수 있음.

### 10.1 현재 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| User.role | ✅ 있음 | GUEST/HOST/ADMIN, 세션 반영 |
| 호스트 라우트 가드 | ⚠️ 부분 | 로그인+플로우만 있음. **role(HOST/ADMIN) 체크 없음** |
| Listing 스키마 | ⚠️ 부분 | Listing + ListingImage 있음. Status는 PENDING/APPROVED/REJECTED. **DRAFT/PUBLISHED·ListingText(다국어)·ListingPrice 테이블 없음** |
| Create/Update API | ✅ 있음 | POST/PATCH 있음. **초안(autosave)** 없음 |
| 사진 업로드 저장소 | ❌ 없음 | 이미지 URL만 저장, 업로드 API/스토리지 없음 |

### 10.2 권장 진행 순서 (실 서비스 문제 없이) — **진행 완료(기반)**

1. **호스트 권한 가드** ✅  
   `src/middleware.ts`: `/host` 구간에서 세션 + role(HOST/ADMIN) 검사. `/host`, `/host/onboarding`, `/host/listings/new` 만 GUEST 허용(첫 등록 후 HOST 전환).

2. **Listing 스키마 정리** ✅  
   - **ListingStatus**에 **DRAFT** 추가. (마이그레이션: `20260222000100_listing_status_draft`)  
   - **Listing**에 **titleKo, titleJa, titleZh** 추가. (마이그레이션: `20260222000200_listing_title_i18n`)  
   - DRAFT = 초안, PENDING = 검토 요청, APPROVED/REJECTED = 관리자 결정.

3. **Create/Update API** ✅  
   - 생성 시 **status: DRAFT \| PENDING** 지원. **titleKo/titleJa/titleZh** 지원.  
   - 수정 시 **status** 포함 초안(autosave) 지원. PATCH에 role(HOST/ADMIN) 검사 있음.

4. **사진 API (URL 기준)** ✅  
   - **POST /api/host/listings/[id]/images** — URL로 이미지 추가.  
   - **DELETE /api/host/listings/[id]/images/[imageId]** — 이미지 삭제.  
   - **PATCH /api/host/listings/[id]/images/reorder** — 순서 변경.  
   - 실제 **파일 업로드 저장소**(Vercel Blob/S3 등)는 추후 연동 시 같은 ListingImage 테이블에 url만 저장하면 됨.

5. **숙소등록 폼 UI**  
   - 위 1~4 반영 후, 폼 필드·이미지 업로드·미리보기를 한 번에 설계.

### 10.3 실 서비스 시 주의

- **DB**: 마이그레이션 전 백업, 롤백 계획. 배포 시 `prisma migrate deploy` 순서 고정.
- **권한**: 서버에서 항상 세션 + role 재검증. 클라이언트만 믿지 않기.
- **업로드**: 파일 타입 화이트리스트, 최대 크기, 업로드 후 URL만 DB에 저장(실제 파일은 스토리지).
- **환경 변수**: 스토리지 키/버킷, NextAuth, DB 등 실서비스용 값 분리(.env.production 등).

---

*문서 수정 시 PROJECT_STATUS.md와 동기화 권장.*
