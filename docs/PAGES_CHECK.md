# 전체 페이지 점검 결과

점검 일자: 프로젝트 정리(Phase 1–4) 및 Prisma User 컬럼 대응 후.

---

## 1. 점검 항목

- **Import 경로**: `@/components/host/listings` → `@/features/host/listings` 이전 후 참조 누락/잘못 여부
- **Prisma User/Listing**: `select` 없이 전체 모델을 읽는 호출로 인한 “column (not available) does not exist” 방지
- **Lint**: `src/app` 기준 오류 없음

---

## 2. 조치한 부분

### Prisma User – DB에 없는 컬럼 참조 방지

| 위치 | 내용 |
|------|------|
| `lib/auth/server.ts` | `getOrCreateServerUser()`의 `prisma.user.upsert`에 `select: { id, name, role, email }` 지정 (이미 반영됨) |
| `lib/auth/options.ts` | signIn/jwt/session 콜백의 `findUnique`/`update`/`create`에 `select` 지정 (이미 반영됨) |
| `app/api/user/profile/route.ts` | **GET**: `displayName`/`profilePhotoUrl` 없이 `id, name, image`만 select. 응답의 `displayName`/`profilePhotoUrl`는 `undefined`로 고정 (마이그레이션 전 DB에서도 조회 실패 방지). **PATCH**: `displayName`/`profilePhotoUrl` update 실패 시(컬럼 없음) catch 후 501 + 안내 메시지 반환 |

### Import 경로

- 호스트 숙소 위저드·테이블·맵·이미지 에디터: 모두 `@/features/host/listings/...` 사용 확인. `@/components/host/listings` 참조 없음.

---

## 3. 페이지/라우트 목록 (문제 없음)

- **Guest**: `(guest)/page.tsx`, `listings/page.tsx`, `listings/[id]/page.tsx`, `profile/page.tsx`, `checkout/page.tsx`, `checkout/success/[token]/page.tsx`, `wishlist/page.tsx`, `payment-redirect/page.tsx`, `login/page.tsx`, `auth/*`, `browse/page.tsx`, `board/page.tsx`, `board/[id]/page.tsx`, `messages/page.tsx`, `help/page.tsx`, `coming-soon/page.tsx`, `signout/page.tsx`, `logout/page.tsx`, `signup/page.tsx`, `debug/reset/page.tsx`
- **Host**: `host/page.tsx`, `host/layout.tsx`, `host/listings/page.tsx`, `host/listings/new/page.tsx`, `host/listings/new/[id]/layout.tsx`, `host/listings/new/[id]/basics|location|pricing|amenities|photos|review/page.tsx`, `host/listings/[id]/edit/page.tsx`, `host/dashboard/page.tsx`, `host/sales/page.tsx`, `host/reservations/page.tsx`, `host/settlements/page.tsx`, `host/calendar/page.tsx`, `host/pending/page.tsx`, `host/onboarding/page.tsx`, `host/account/page.tsx`, `host/messages/page.tsx`, `host/notifications/page.tsx`, `host/tools/listings-e2e/page.tsx`
- **Admin**: `admin/page.tsx`, `admin/approvals/page.tsx`, `admin/settlements/page.tsx`
- **기타**: `health/page.tsx`, `offline/page.tsx`

위 페이지들은 현재 기준으로 import·구조 문제 없음.  
호스트 레이아웃은 `getCurrentHostFlow()` → `getOrCreateServerUser()`를 사용하며, `getOrCreateServerUser`의 `upsert`에 `select`가 지정되어 있어 User 테이블에 `displayName`/`profilePhotoUrl`가 없어도 동작함.

---

## 4. 마이그레이션 후 복구할 부분

- **프로필 API GET**: `displayName`/`profilePhotoUrl`를 실제로 쓰려면, 마이그레이션 적용 후 `app/api/user/profile/route.ts`의 GET에서 `select`에 `displayName`, `profilePhotoUrl`를 다시 넣고, 응답에 DB 값을 반환하도록 되돌리면 됨.
- **프로필 API PATCH**: 마이그레이션 후에는 컬럼이 생기므로 501 분기 없이 정상 동작.

---

## 5. 빌드

로컬에서 다음으로 전체 빌드 권장:

```bash
npm run build
```

(샌드박스/환경에 따라 `next build`가 실패할 수 있어, 위 조치만으로 “모든 페이지에 문제 없는지”를 코드 기준으로 점검한 결과를 정리함.)
