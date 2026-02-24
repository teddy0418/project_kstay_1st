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
