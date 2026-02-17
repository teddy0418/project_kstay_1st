# KSTAY — Project Status

> **목적:** 다른 AI/팀원 브리핑용. 현재 구현 상태, 파일 구조, 정책, 다음 단계를 한 문서에 정리.

---

## 1. 프로젝트 개요

- **이름:** KSTAY  
- **한 줄:** 한국 숙소 예약 플랫폼. 게스트 수수료 10%, 호스트 수수료 0%로 “Best Value” 강조.  
- **스택:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Turbopack.

---

## 2. 현재 구현된 기능 목록

### 2.1 메인(홈) & 탐색
- **홈 (`/`)**  
  - 인기 목적지(Seoul, Busan, Jeju, Gyeongju, Gangneung) — 로컬 SVG 이미지, 가로 스크롤.  
  - “Top Recommended Stays” 그리드(상위 8개), `ListingCard` 사용.  
- **탐색 (`/browse`)**  
  - 쿼리 `where` 기준 필터링.  
  - `ResultsView`: 그리드만 표시(지도/Leaflet 비표시).  
- **레이아웃**  
  - **중앙 정렬:** `Container`로 `max-w-[1200px] mx-auto` 적용(여기어때 스타일).  
  - 상단: `Header`(Stays/Board 탭, 통화·언어, 햄버거 메뉴 → Log in/Sign up, Wishlist, Profile, Log out 등).  
  - 검색: `FloatingSearch` → `SearchBar`(Where / When / Who 3단, Airbnb 스타일 세그먼트, 모달).  
  - 하단: `BottomNav`(모바일, Home / Wishlist / Board / Messages / Profile).

### 2.2 상세 & 예약
- **리스팅 상세 (`/listings/[id]`)**  
  - 갤러리(`ListingGallery`, `<img>` 사용), 호스트 프로필(`<img>`), Best Value 문구, MapModal, BookingWidget.  
  - ID 미존재 시 “Listing not found” + Available IDs 목록(디버그용).  
- **체크아웃 (`/checkout`)**  
  - `listingId`, `start`, `end`, `guests` 쿼리 기반.  
  - 베이스 + 게스트 서비스 수수료 10% 표시.  
  - 결제(PortOne) 플레이스홀더.

### 2.3 기타 게스트
- **인증**  
  - `/auth` — Log in / Sign up 통합(Google/Apple 플레이스홀더).  
  - `/login`, `/signup` — 별도 페이지 존재(필요 시 리다이렉트 가능).  
- **보드**  
  - `/board`, `/board/[id]` — Food & Travel Tips 포토 보드(목록·상세, `<img>`).  
- **디버그/헬스**  
  - `/listings` — 목록 ID 링크 모음.  
  - `/health` — “OK” 단순 응답.

### 2.4 호스트 & 어드민
- **호스트**  
  - `/host` 대시보드, `/host/listings/new`, `/host/calendar`, `/host/settlements`(MVP 플레이스홀더).  
- **어드민**  
  - `/admin`, `/admin/settlements` — 예약 테이블, `pg_tid`, `settlement_id` 컬럼, Ready/Hold 상태.

### 2.5 UI/공통
- **가격**  
  - 선택 통화(USD/JPY/CNY/KRW) 표시, `formatDualPriceFromKRW`(메인 + ≈ KRW).  
- **위시리스트**  
  - 카드/상세 하트 호버 시 빨간 하트, 비로그인 시 토스트 안내.  
- **이미지**  
  - `next/image` 제거, `<img>` 사용(500 방지, Unsplash/로컬 SVG 등).

---

## 3. 주요 파일 구조와 역할

```
src/
├── app/
│   ├── layout.tsx                 # 루트: ToastProvider, CurrencyProvider, 폰트
│   ├── (guest)/
│   │   ├── layout.tsx              # Header, Suspense(FloatingSearch), children, BottomNav
│   │   ├── page.tsx                # 홈: PopularDestinations + Top 8 ListingCard
│   │   ├── browse/page.tsx         # where 필터 → ResultsView
│   │   ├── listings/page.tsx       # 디버그: ID 링크 목록
│   │   ├── listings/[id]/page.tsx  # 리스팅 상세(갤러리, 호스트, BookingWidget)
│   │   ├── board/page.tsx          # 보드 목록
│   │   ├── board/[id]/page.tsx     # 보드 상세
│   │   ├── auth/page.tsx           # 로그인/회원가입 통합
│   │   ├── checkout/page.tsx       # 결제 플로우(쿼리 기반)
│   │   ├── login, signup, wishlist, messages, profile  # 플레이스홀더
│   ├── host/                       # 호스트 레이아웃 + 대시보드, listings/new, calendar, settlements
│   ├── admin/                      # 어드민 레이아웃 + summary, settlements
│   └── health/page.tsx              # 헬스체크
│
├── components/
│   ├── layout/
│   │   ├── Container.tsx           # max-w-[1200px] mx-auto (중앙 정렬)
│   │   ├── Header.tsx              # 로고, Stays/Board 탭, Globe, 햄버거(Log in/Sign up, Log out 등)
│   │   ├── FloatingSearch.tsx     # pathname에 따라 SearchBar 표시 여부
│   │   └── BottomNav.tsx           # 모바일 하단 5탭
│   └── ui/
│       ├── SearchBar.tsx           # Where/When/Who 모달, URL 파라미터 → /browse
│       ├── ToastProvider.tsx      # 토스트 알림
│       ├── CurrencyProvider.tsx    # 통화 상태(USD/JPY/CNY/KRW)
│       └── ErrorBoundary.tsx       # 지도 등 오류 시 폴백
│
├── features/
│   ├── home/
│   │   └── PopularDestinations.tsx  # 인기 목적지 가로 스크롤(로컬 SVG)
│   ├── listings/
│   │   ├── ListingCard.tsx         # 카드(가격 듀얼, 하트, active/onHoverChange 옵션)
│   │   ├── ListingGallery.tsx     # 상세 갤러리 + 라이트박스
│   │   ├── DetailActions.tsx       # 상세 하트/공유
│   │   ├── MapModal.tsx            # 주소/지도 팝업
│   │   └── BookingWidget.tsx       # 날짜·인원, 가격, 예약 CTA
│   ├── browse/
│   │   ├── ResultsView.tsx         # 그리드 전용(ListingCard 반복)
│   │   └── BrowseMapLayout.tsx     # (미사용) 지도+리스트 레이아웃
│   ├── search/
│   │   └── CategoryPills.tsx        # 현재 return null (비표시)
│   └── map/                        # LeafletMap, MapPanel (BrowseMapLayout용, 현재 미노출)
│
├── lib/
│   ├── utils.ts                    # cn() (클래스명 합침, 의존성 없음)
│   ├── format.ts                   # formatKRW, formatDateRange, diffNights 등
│   ├── policy.ts                   # 수수료·취소·KST 기준
│   ├── currency.ts                 # 환율, formatDualPriceFromKRW
│   ├── mockData.ts                 # listings, categories
│   └── boardMock.ts                # boardPosts
│
└── types/
    └── index.ts                    # Listing, BoardPost, Booking, BookingStatus
```

---

## 4. 핵심 정책 (코드/설계 기준)

| 항목 | 값 | 비고 |
|------|-----|------|
| **게스트 수수료** | 10% | `policy.ts` `GUEST_SERVICE_FEE_RATE = 0.1` |
| **호스트 수수료** | 0% | `HOST_FEE_RATE = 0` → “Best Value”, “0% Host Fee” 문구 |
| **무료 취소** | 체크인 7일 전까지 (KST 기준) | `FREE_CANCELLATION_DAYS = 7`, `freeCancellationDeadlineUtcMs` |
| **호스트 거절** | 결제 후 24시간 이내 거절 가능, 이후 자동 void/환불 | `HOST_DECISION_HOURS = 24` |
| **시간대** | Asia/Seoul (KST) | 정산·취소 데드라인 등 KST 기준 설계 |
| **정산 주기** | 화요일 정산 (설계/다음 단계) | 코드에는 “Weekly auto-settlement” 문구만 있음, 화요일 규칙은 다음 단계에서 반영 예정 |
| **가격 표시** | Tax & Service Fee Included, 베이스+10% 한 번에 표시 | 체크아웃에서 “no surprises” 강조 |

---

## 5. Next Steps (우선순위)

1. **인증 연동**  
   - Google/Apple 소셜 로그인(1초 회원가입).  
   - 로그인 시 Wishlist·예약 가능하도록 연동.

2. **결제 연동**  
   - PortOne 연동, `pg_tid` 저장.  
   - 결제 후 상태: PAID_PENDING_HOST → CONFIRMED / DECLINED_VOIDED.

3. **정산 플로우**  
   - 화요일 정산 규칙 명시 및 `settlement_id` 발급·연동.  
   - 어드민/호스트 정산 화면에서 Ready → Settled 전환.

4. **디버그 로그 제거**  
   - `console.log("[KSTAY...])` 등 개발용 로그 제거.

5. **선택: 지도 다시 노출**  
   - `ResultsView`에 `?view=map` 시 `BrowseMapLayout` 노출 여부 결정 후, 필요 시 Suspense/에러 바운더리 유지.

6. **선택: next/image 재도입**  
   - 이미지 도메인 고정 후 `next.config`에 등록, 500 원인 제거된 뒤 단계적 재도입 검토.

---

*문서 기준: 프로젝트 현재 상태 기준으로 작성. 라우트·파일명 변경 시 이 문서도 동기화할 것.*
