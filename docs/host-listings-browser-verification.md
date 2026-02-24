# 호스트 숙소등록 플로우 — 브라우저 검증 체크리스트

아래는 **브라우저에서 로그인한 뒤** Network 탭으로 확인하는 항목입니다.

## 사전 준비
- [ ] `npm run dev` 실행 (예: 포트 3001)
- [ ] HOST 또는 ADMIN 계정으로 로그인 (또는 GUEST로 로그인 후 `/host/listings/new`에서 초안 저장 시 HOST 전환)

---

## P0: 엔드투엔드 HTTP 검증

### (1) 초안 저장
- [ ] 접속: `/host/listings/new`
- [ ] 필드 입력 후 **「초안 저장」** 클릭
- [ ] Network: `POST /api/host/listings` → **201**
- [ ] Response body: `{ "data": { "id": "...", "status": "DRAFT" } }` 형태

### (2) 수동 저장 / autosave
- [ ] 위에서 생성된 상태에서 제목·주소·가격·체크인/체크아웃 등 수정
- [ ] 「지금 저장」 클릭 또는 입력 멈춤 후 autosave 대기
- [ ] Network: `PATCH /api/host/listings/[id]` → **200**
- [ ] Request body에 `checkInTime` / `checkOutTime` 포함 여부 확인

### (3) 이미지
- [ ] 이미지 URL 입력 후 **「추가」** → Network: `POST /api/host/listings/[id]/images` → **201**
- [ ] 이미지 **삭제** → `DELETE /api/host/listings/[id]/images/[imageId]` → **200**
- [ ] **↑/↓** 로 순서 변경 → `PATCH .../images/reorder` body `{ "imageIds": [...] }` → **200**

### (4) 검토 요청(PENDING)
- [ ] **「검토 요청(PENDING)」** 클릭
- [ ] Network: `PATCH /api/host/listings/[id]` body `{ "status": "PENDING" }` → **200**
- **서버 검증:** status=PENDING 시 서버에서 제목·주소(city/area/address)·가격>0·이미지 1장 이상을 검사. 미충족 시 **400** `VALIDATION_ERROR` 반환.

---

## P1: 목록·편집 진입·GET 로딩

### (5) 목록
- [ ] 접속: `/host/listings`
- [ ] 방금 만든 리스팅이 목록에 보임
- [ ] **「편집」** 링크가 `/host/listings/[id]/edit` 형태인지 확인

### (6) 편집 모드 GET 로딩
- [ ] 목록에서 **「편집」** 클릭 → `/host/listings/new?id=xxx` 로 이동
- [ ] Network: `GET /api/host/listings/[id]` → **200**
- [ ] Response: `{ "data": { "id", "status", "title", "titleKo", "images": [...] } }` 형태
- [ ] 화면에 **제목·위치·가격·체크인/체크아웃·이미지 목록**이 채워져 있는지 확인

---

## 자동 진단 페이지 — 2단계로 동작 확인

**사용자 검증은 아래 2단계만 하면 됩니다.**

1. **터미널에서:** `npm run dev`
2. **브라우저에서:** `/host/tools/listings-e2e?autostart=1` 접속 후 **로그인 1번** → 진단이 자동 실행되고 단계별 PASS/FAIL 표시

(또는 `npm run diagnose:hostlistings` 실행 시 브라우저가 열리면, 로그인만 하면 자동 실행)

- **URL:** `/host/tools/listings-e2e` (또는 `?autostart=1` 로 진입 시 로그인 후 자동 실행)
- **조건:** `NODE_ENV`가 production이면 진단 페이지는 항상 차단(404). dev/preview에서만 `ENABLE_HOST_LISTINGS_DIAGNOSTICS` 또는 `NEXT_PUBLIC_ENABLE_HOST_LISTINGS_DIAGNOSTICS`=true 일 때 활성화. 운영 환경에는 해당 변수를 설정하지 않도록 권장.
- **동작:** HOST/ADMIN으로 로그인한 뒤 해당 URL에 접속하면, 단계별 API 호출(POST 생성 → PATCH → 이미지 POST/reorder/delete → PATCH PENDING → GET)을 실행하고 각 단계별 PASS/FAIL 및 실패 시 자동 분류(401/403/400/500)를 화면에 표시. 결과 JSON 복사 가능.
- **생성 데이터:** 테스트용 리스팅 제목에 `[DIAG]` 접두사가 붙으며, 삭제 API가 없어 DB에 남음. 마지막에 status를 DRAFT로 되돌릴지 선택 가능(기본: 되돌리기).

---

## 실패 시
- **401:** 로그인 후 재시도. NextAuth 세션 쿠키 확인.
- **403:** 해당 리스팅의 소유자(HOST) 또는 ADMIN인지 확인.
- **400:** Request body가 Zod 스키마와 일치하는지 확인 (필드명·타입·HH:mm 형식).
- **500:** 서버 터미널 로그 확인. `npm run verify:hostlistings` 로 Prisma/DB 연동은 이미 통과한 상태.
