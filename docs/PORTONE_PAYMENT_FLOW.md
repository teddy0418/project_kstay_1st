# PortOne 결제 웹훅 기반 예약 확정 설계

## Flow

```
[체크아웃] → [POST /api/bookings] → Booking(PENDING_PAYMENT) + Payment(INITIATED) 생성
    ↓
[프론트] requestPayment(PortOne SDK) → 사용자 결제 진행
    ↓
[PortOne] 결제 완료 시 redirectUrl(/payment-redirect)로 리디렉션
    ↓
[PortOne] 웹훅 POST /api/payments/portone/webhook (시그니처 검증, raw body)
    ↓
[웹훅] 1) Webhook.verify(secret, rawBody) 시그니처 검증
       2) PaymentWebhookEvent 저장 (idempotency: provider+webhookId unique)
       3) PortOne API GET /payments/{id} (Authorization: PortOne {API_SECRET})로 상태/금액 재검증
       4) status=PAID && 금액 일치 시 → Booking CONFIRMED, Payment PAID
       5) sendBookingConfirmedEmailIfNeeded
    ↓
[프론트] /checkout/success/{token} 폴링 → status=CONFIRMED 시 "예약 확정" 표시
```

**핵심 원칙**
- 예약 확정은 **웹훅 수신** 기준 (프론트 결제 성공만 믿지 않음)
- 웹훅 body는 **raw string**으로 시그니처 검증 (JSON parse 후 검증 X)
- 결제 상태/금액은 **PortOne API**로 서버에서 재검증
- idempotency: `PaymentWebhookEvent` unique(provider, webhookId)

## DB changes

| 모델/필드 | 용도 |
|-----------|------|
| `Payment.amountKrw` (Int?, optional) | KRW 결제 시 기대 금액 저장, 웹훅 금액 검증용 |
| `Payment.providerPaymentId` | PortOne paymentId (현재 publicToken과 동일 값 사용) |
| `PaymentWebhookEvent` | 웹훅 중복 수신 방지 (provider+webhookId unique) |

**마이그레이션**: `Payment.amountKrw` ADD COLUMN (optional, 기존 데이터 null 허용)

## API routes

| Method | Path | 역할 |
|--------|------|------|
| POST | `/api/bookings` | 예약 생성 + Payment 생성, PortOne 모드 시 portone payload 반환 |
| GET | `/api/bookings/public/[token]` | 예약 조회 (status 포함, success 페이지 폴링용) |
| POST | `/api/bookings/public/[token]/confirm` | MOCK 모드 전용 즉시 확정 |
| POST | `/api/payments/portone/webhook` | PortOne 웹훅 수신 (시그니처 검증, raw body, idempotency) |

## Env keys (값 출력 금지)

| 키 | 용도 |
|----|------|
| `PAYMENT_PROVIDER` | `MOCK` \| `PORTONE` (서버) |
| `NEXT_PUBLIC_PAYMENT_PROVIDER` | `MOCK` \| `PORTONE` (프론트) |
| `PORTONE_STORE_ID` | PortOne 스토어 ID |
| `PORTONE_CHANNEL_KEY` | PortOne 채널 키 (프론트 SDK용) |
| `PORTONE_API_SECRET` | PortOne API Secret (서버 API 호출, 금액/상태 재검증) |
| `PORTONE_WEBHOOK_SECRET` | 웹훅 시그니처 검증용 |
| `NEXT_PUBLIC_PORTONE_PAY_METHOD` | (선택) `CARD` \| `EASY_PAY` |
| `NEXT_PUBLIC_SITE_URL` | 결제 redirectUrl 베이스 (기본 localhost:3001) |

## How to test

### 1) MOCK 모드 (웹훅 없이)
1. `PAYMENT_PROVIDER=MOCK`, `NEXT_PUBLIC_PAYMENT_PROVIDER=MOCK` 설정
2. 숙소 상세 → 날짜 선택 → 결제 → "지금 결제" 클릭
3. 즉시 `/checkout/success/{token}` 이동, status=CONFIRMED
4. 프로필 Your trips에 예약 표시 확인

### 2) PORTONE 모드 (웹훅 기반)
1. `PAYMENT_PROVIDER=PORTONE`, `NEXT_PUBLIC_PAYMENT_PROVIDER=PORTONE` 설정
2. `PORTONE_STORE_ID`, `PORTONE_CHANNEL_KEY`, `PORTONE_API_SECRET`, `PORTONE_WEBHOOK_SECRET` 설정
3. PortOne 콘솔에서 웹훅 URL 등록: `https://{도메인}/api/payments/portone/webhook`
4. 숙소 상세 → 날짜 선택 → 결제 → "지금 결제" 클릭
5. PortOne 결제창에서 테스트 결제 완료
6. `/payment-redirect` → `/checkout/success/{token}` 리디렉션
7. success 페이지가 "처리 중" → 웹훅 수신 후 "예약 확정"으로 자동 갱신 (폴링)
8. 프로필 Your trips에 예약 표시 확인

### 3) 웹훅 idempotency
1. 동일 webhook-id로 웹훅 2회 전송
2. 첫 번째: 200 OK, Booking CONFIRMED
3. 두 번째: 200 OK (duplicate webhook), Booking 상태 변경 없음

### 4) 금액 검증
1. PortOne API에서 반환한 amount/currency가 Booking 예상 금액과 불일치 시
2. 예약 확정하지 않음 (로그만 기록, 200 OK 반환)

---

## PortOne 키 정리 (결제창 vs API)

| 키 | 결제창 필요? | 용도 |
|----|-------------|------|
| **storeId** | ✅ 필수 | 상점 식별 (연동 정보에서 확인) |
| **channelKey** | ✅ 필수 | 채널별 키 (카카오페이/PayPal/Eximbay 등) |
| **API Secret** | ❌ 불필요 | 서버 전용 (웹훅 검증, 결제 상태 조회) |
| **Webhook Secret** | ❌ 불필요 | 웹훅 시그니처 검증용 | 

**결제창이 뜨려면 storeId + channelKey만 있으면 됩니다.** API Secret은 결제창과 무관합니다.

---

## PortOne 테스트 결제 설정 (결제창 테스트)

결제창이 뜨고 테스트 결제까지 하려면 PortOne 테스트 연동이 필요합니다.

### 1단계: PortOne 가입 및 상점 생성 (약 5분)

1. **https://admin.portone.io** 접속 → 회원가입
2. 상점 생성 시 **테스트 환경이 자동 활성화**됨 (실제 결제 없음)
3. 상점 생성 후 **연동 정보** 메뉴에서 **상점 ID(storeId)** 복사

### 2단계: 테스트 채널 추가

1. **결제 연동 → 테스트 연동 관리** 이동
2. **채널 추가** 클릭
3. PG사 선택 (예: 토스페이먼츠, 이지페이 등 – 테스트용 MID 자동 부여)
4. 결제 모듈 **V2** 선택 → 저장
5. 생성된 채널의 **채널 키(channelKey)** 복사

### 3단계: .env.local 설정

```env
PAYMENT_PROVIDER=PORTONE
NEXT_PUBLIC_PAYMENT_PROVIDER=PORTONE
PORTONE_STORE_ID=발급받은_상점ID
NEXT_PUBLIC_PORTONE_STORE_ID=발급받은_상점ID
# 테스트용: 채널 하나만 있으면 아래 하나만 설정해도 됨
PORTONE_CHANNEL_KEY=채널키
# 또는 결제 수단별로:
# PORTONE_CHANNEL_KEY_KAKAOPAY=채널키
# PORTONE_CHANNEL_KEY_PAYPAL=채널키
# PORTONE_CHANNEL_KEY_EXIMBAY=채널키
```

- `PORTONE_CHANNEL_KEY` 하나만 설정하면 모든 결제 수단에서 사용
- 결제 수단별 채널이 있으면 `PORTONE_CHANNEL_KEY_KAKAOPAY` 등 개별 설정

### 4단계: API Secret (선택 – 웹훅용)

- **연동 정보 → V2 API Secret** 발급
- `PORTONE_API_SECRET`, `PORTONE_WEBHOOK_SECRET` 설정 시 웹훅으로 예약 자동 확정
- localhost에서는 웹훅 수신이 어려우므로 **ngrok** 등으로 터널링 필요

### 5단계: localhost 테스트

- `NEXT_PUBLIC_SITE_URL=http://localhost:3001` 이면 결제 후 `http://localhost:3001/payment-redirect`로 리다이렉트
- PortOne 테스트 카드로 결제 완료 → 결제창 테스트 가능

### 결제창이 안 뜰 때 확인

1. **admin.portone.io → 결제 연동 → 연동 정보**: storeId, channelKey 값이 정확한지 확인
2. **채널 상태**: 테스트/실연동 채널이 "활성" 상태인지 확인
3. **브라우저 콘솔(F12)**: `[CheckoutPaymentCard] PortOne requestPayment error:` 등 에러 메시지 확인
4. **environment**: 테스트 채널이면 `NEXT_PUBLIC_PORTONE_ENVIRONMENT=sandbox`, 실연동이면 `live`
