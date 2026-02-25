# 숙소등록(위저드) 점검 보고서

## 1. 데이터 흐름 — 어메니티가 상세페이지로 전달되는가

### 흐름
- **위저드(어메니티 단계)** → `patch({ amenities: string[] })` → **PATCH /api/host/listings/[id]** → `updateHostListing` → **DB `Listing.amenities`**
- **숙소 상세(게스트)** → `getPublicListingById(id)` → **Prisma `findFirst({ where: { id, status: "APPROVED" }, include: { images, host } })`** → `toListing(row)`에서 `amenities: Array.isArray(row.amenities) ? row.amenities : []` → **`AmenitiesList` 컴포넌트**

### 결론
- **전달 정상.** `getPublicListingById`는 `include`만 쓰므로 Listing의 모든 스칼라 필드(amenities 포함)가 반환되고, `toListing()`이 `amenities`를 그대로 넘기며, 상세페이지에서 `listing.amenities`로 `AmenitiesList`에 전달됨.
- **알 수 없는 키:** DB에 이전에 추가했던 어메니티 키가 남아 있으면 상세에서 `getAmenityLabel(key, lang)`가 키를 그대로 반환해 표시됨. 아이콘은 `CheckCircle2`로 폴백. 크래시 없음.

---

## 2. DB 및 폴더 구조

### DB (Prisma)
- **Listing**: 위저드에서 쓰는 필드 대부분 일원화됨. `businessRegistrationDocUrl`, `lodgingReportDocUrl` 등 서류 URL, `extraGuestFeeKrw`, `amenities` 등 정리됨.
- **host-listings.ts**: 호스트용 단건 조회/수정(`findHostListingForEdit`, `updateHostListing`, `findHostListingOwnership`)과 이미지/카운트 등이 한 레포에 있음. 역할이 명확함.
- **listings.ts**: 게스트용 공개 조회(`getPublicListingById`, `getPublicListings` 등). 승인(APPROVED)만 노출. mock fallback 있음.

### 폴더 구조
- **라우트**: `app/host/listings/new/[id]/` 아래 location, pricing, amenities, photos, guide, review — 단계별로 분리됨.
- **기능**: `features/host/listings/` — `ListingWizardContext`, `ListingWizardShell`, `HostListingImagesUrlEditor` 등 위저드 공통 로직.
- **API**: `app/api/host/listings/[id]/` — GET/PATCH/DELETE, `documents/upload`, `images/upload`, `images/reorder` 등 리스팅 단위로 묶임.
- **공통**: `lib/amenities.ts`, `lib/amenity-icons.tsx`, `lib/property-types.ts` — 위저드·상세에서 공유.

**정리:** DB 스키마와 레포/폴더 구조는 숙소등록·상세 노출 용도에 맞게 정리되어 있음.

---

## 3. 보안

### 인증·인가
- **GET/PATCH /api/host/listings/[id]**: `getOrCreateServerUser()`, HOST 또는 ADMIN만 허용. PATCH는 `findHostListingOwnership(id)`로 본인(또는 ADMIN)만 수정 가능.
- **documents/upload**: 동일하게 로그인 + HOST/ADMIN, `findHostListingOwnership(listingId)`로 해당 리스팅 소유자만 업로드 가능.
- **images/upload, reorder**: 동일 패턴으로 소유자만 가능하도록 구현되어 있음.

### 입력 검증
- **PATCH body**: `updateHostListingSchema` (Zod) `.strict()`로 허용 필드만 수신. `basePriceKrw`, `extraGuestFeeKrw`, URL 필드 등 타입/범위 제한 있음.
- **문서 업로드**: `type`은 `business_registration` | `lodging_report`만 허용. MIME 타입·파일 크기(10MB) 제한. **확장자**는 클라이언트 `file.name`에서 추출하되 `.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`만 허용하도록 화이트리스트 적용됨(경로 조작 방지).

### 민감 정보 노출
- **사업자등록증/숙소 유형별 신고·지정증 URL**: `findHostListingForEdit`에서만 선택됨. 게스트용 `getPublicListingById`에는 포함되지 않음. 상세페이지에 노출되지 않음.

### 개선 권장
- **파일 업로드**: MIME만으로는 부족할 수 있음. 운영 환경에서는 실행 파일 등 위험 확장자 차단·바이너리 검사(매직 바이트) 추가 권장.
- **업로드 파일 저장 위치**: `public/uploads/documents`에 저장되므로 같은 도메인에서 URL만 알면 접근 가능. 관리자/호스트만 볼 수 있도록 하려면 인증이 필요한 경로로 서빙하거나, 서버에서 한 번 더 권한 체크 후 스트리밍하는 방식 검토.

---

## 4. 추후 예상 이슈 및 권장 사항

| 구분 | 내용 | 권장 |
|------|------|------|
| **어메니티 키** | 위저드에서 새 키 추가 시 DB에는 이미 저장된 이전 키가 남을 수 있음. 상세는 키를 그대로 표시하므로 동작은 하되, 라벨이 없으면 키 문자열이 노출됨. | (선택) PATCH 시 `amenities`를 `AMENITY_KEYS`에 있는 값만 허용하도록 스키마 `.refine()` 추가. 또는 주기적으로 알 수 없는 키 정리. |
| **이미지 저장** | 현재 이미지는 URL로 외부/업로드 URL 저장. `public/uploads` 문서와 달리 이미지는 URL 저장만 있음. | 업로드 파일이 늘어나면 스토리지(S3 등) 이전, CDN 캐시 정책 검토. |
| **문서 URL** | `public/uploads/documents` 상대 경로. 배포 시 디스크가 비휘발성인지, 스케일 아웃 시 공유 스토리지인지에 따라 파일 유실·불일치 가능. | 운영에서는 객체 스토리지(S3 등) + 절대 URL 저장 권장. |
| **승인 후 수정** | `isLocked: listing?.status !== "DRAFT"`로 DRAFT가 아니면 수정 불가. PENDING/APPROVED 시 위저드에서 필드 잠금. | 승인된 리스팅의 일부 필드만 수정 허용하는 “편집 모드”가 필요해지면, 수정 가능 필드 화이트리스트와 재검토 플로우 정의 필요. |
| **에러 처리** | `getPublicListingById` 등에서 try/catch 후 mock fallback. DB 오류가 있어도 에러를 던지지 않고 mock으로 대체됨. | 개발 시에는 로그/모니터링, 운영에서는 fallback 범위 축소 또는 명시적 에러 응답 고려. |

---

## 5. 요약

- **어메니티**: 위저드 → API → DB → `getPublicListingById` → 상세 `AmenitiesList`까지 정상 전달됨.
- **DB/폴더**: Listing 중심으로 호스트용/게스트용 레포와 라우트가 나뉘어 있고, 위저드 단계·API가 일관되게 정리되어 있음.
- **보안**: 호스트 API는 인증·소유권 검사·스키마 검증·업로드 확장자 제한이 적용되어 있음. 문서 URL은 게스트에 노출되지 않음.
- **추가 권장**: 문서/이미지 운영 스토리지 이전, 업로드 파일 내용 검증 강화, amenities 허용 키 제한(선택), 승인 후 수정 정책 정리.

---

## 6. 적용된 개선 (추가 반영)

- **스토리지 추상화** (`lib/storage/documents.ts`): 서류 업로드 시 `DOCUMENT_STORAGE=local`(기본)이면 `public/uploads/documents`, `DOCUMENT_STORAGE=s3`이면 AWS S3에 저장. `.env.example`에 S3 관련 변수 예시 추가.
- **승인된 숙소 PATCH 제한**: `status === "APPROVED"`인 경우 `checkInGuideMessage`, `houseRulesMessage`, `detailedAddress`만 수정 가능. 그 외 필드는 무시.
- **승인된 숙소 편집 페이지** (`/host/listings/[id]/approved-edit`): 체크인 안내·이용 규칙·상세 주소만 수정하는 폼. 판매 관리 목록에서 승인(APPROVED) 숙소의 "편집" 링크가 이 페이지로 연결됨.
