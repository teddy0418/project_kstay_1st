# 앱스토어 출시 전 체크리스트

> KSTAY 앱을 Android (Google Play) / iOS (App Store)에 출시하기 전 점검해야 할 항목을 정리한 문서입니다.

---

## 출시 방식 비교

| 방식 | Android | iOS | 난이도 | 비고 |
|------|---------|-----|--------|------|
| **PWA (TWA)** | Google Play 출시 가능 | App Store 불가 | 낮음 | 코드 변경 거의 없음 |
| **Capacitor / Ionic** | 가능 | 가능 | 중간 | 기존 웹앱을 네이티브 래핑 |
| **React Native (WebView)** | 가능 | 가능 | 중간 | |
| **Flutter / 네이티브** | 가능 | 가능 | 높음 | 전체 재개발 필요 |

### 권장 로드맵

1. **1단계**: 웹 PWA 완성 (현재)
2. **2단계**: Android TWA로 Play Store 출시 (가장 빠름)
3. **3단계**: Capacitor로 iOS App Store 출시 (네이티브 기능 1개 이상 추가)

---

## 공통 점검 사항

### 1. PWA 기본 완성도

- [ ] **앱 아이콘 (PNG)**: 현재 SVG 플레이스홀더 → 실제 브랜드 PNG 아이콘으로 교체
  - Android: 192×192, 512×512 (maskable 포함)
  - iOS: 1024×1024 (App Store용), 180×180 (apple-touch-icon)
- [ ] **스플래시 스크린**: 각 디바이스 해상도별 스플래시 이미지 제작
- [ ] **manifest.ts**: `name`, `short_name`, `description`, `theme_color` 최종 확정

### 2. 반응형 / 모바일 UX

- [ ] 모든 페이지의 **모바일 터치 영역** 최소 44×44px 확인
- [ ] **Safe Area** 대응 (노치, 홈 인디케이터, 다이나믹 아일랜드)
- [ ] Android 물리 **백버튼** 대응 (뒤로가기 네비게이션)
- [ ] 키보드 올라올 때 입력 필드가 가려지지 않는지 확인
- [ ] 가로 모드(landscape) 대응 여부 결정

### 3. 성능

- [ ] **Lighthouse 점수** 90+ (Performance, Accessibility, Best Practices, SEO)
- [ ] 이미지 최적화: WebP/AVIF 포맷 활용 (`next/image` 자동 처리)
- [ ] `next build` 후 페이지별 JS 번들 사이즈 점검
- [ ] Service Worker 오프라인 캐싱 전략 확인 (Serwist)

### 4. 보안

- [ ] HTTPS 적용 확인 (완료됨)
- [ ] 딥링크 / 유니버셜 링크 설정
- [ ] OAuth 리다이렉트 URI에 앱 스킴 추가 (Google, Kakao, LINE, Facebook)

### 5. 결제 관련 (중요)

- [ ] **인앱 결제 정책 확인**: Google/Apple은 디지털 상품에 자체 결제 시스템 강제
- [ ] 숙박 예약은 **물리적 서비스** → 외부 결제(PortOne) 사용 가능 (Airbnb와 동일 케이스)
- [ ] App Store 심사 시 "물리적 서비스 예약"임을 명확히 설명 준비

---

## Android (Google Play) 전용

| 항목 | 설명 | 상태 |
|------|------|------|
| TWA 또는 Capacitor 설정 | TWA가 가장 간단 (PWA → Play Store 직접 출시) | [ ] |
| `assetlinks.json` | 도메인 소유권 증명 (`/.well-known/assetlinks.json`) | [ ] |
| 서명 키 (keystore) | 생성 및 안전한 곳에 보관 | [ ] |
| Play Console 개발자 등록 | $25 1회 결제 | [ ] |
| 타겟 API 레벨 | 최신 Android API 레벨 대응 필수 | [ ] |
| 개인정보처리방침 URL | Play Store 필수 요구 사항 | [ ] |
| 앱 콘텐츠 등급 | IARC 등급 분류 작성 | [ ] |

## iOS (App Store) 전용

| 항목 | 설명 | 상태 |
|------|------|------|
| Capacitor 설정 | iOS는 TWA 불가 → 네이티브 래핑 필수 | [ ] |
| Apple Developer 계정 | 연 $99 (매년 갱신) | [ ] |
| 심사 가이드라인 4.2 대응 | 단순 WebView 래핑은 리젝 가능 → 네이티브 기능 1개 이상 추가 | [ ] |
| 네이티브 기능 추가 | 푸시 알림, 카메라, 생체인증 등 최소 1개 | [ ] |
| ATS (App Transport Security) | HTTPS 강제 (이미 대응됨) | [ ] |
| 개인정보 라벨 | App Store Connect에서 데이터 수집 항목 명시 | [ ] |
| 스크린샷 제작 | iPhone 6.7", 6.5", 5.5" / iPad 12.9" 각각 | [ ] |

---

## 출시 전 필수 준비물

- [ ] **법적 문서**: 개인정보처리방침 + 이용약관 페이지 (웹에 게시, URL 필요)
- [ ] **푸시 알림 연동**: FCM (Android) + APNs (iOS) — 예약 확인, 호스트 메시지 등
- [ ] **딥링크**: `kstay://listings/123` 같은 앱 스킴 등록
- [ ] **분석/크래시 리포트**: Firebase Analytics 또는 Sentry 연동
- [ ] **앱 아이콘 & 스토어 스크린샷**: 디자이너와 최종 에셋 제작
- [ ] **관광사업자 등록증**: 한국에서 숙박 중개 앱 출시 시 필요

---

## AI(Cursor)가 해줄 수 있는 것 vs 직접 해야 하는 것

### Cursor가 처리 가능

- Capacitor 프로젝트 세팅 및 설정
- 딥링크 / 유니버셜 링크 코드 작성
- 푸시 알림 연동 코드 (FCM, APNs)
- manifest / 메타데이터 설정
- Service Worker 최적화
- Safe Area, 모바일 UX 개선 (CSS)
- 개인정보처리방침 페이지 작성 (법률 검토는 별도)
- 성능 최적화 (번들 분석, 코드 스플리팅)
- OAuth 리다이렉트 URI 수정
- Sentry / Analytics 연동 코드
- TWA (bubblewrap) 설정

### 직접 해야 하는 것

- Apple Developer 계정 등록 ($99/년)
- Google Play Console 등록 ($25)
- 앱 아이콘 / 스크린샷 **디자인** (디자이너 필요)
- App Store / Play Store 콘솔에서 앱 제출
- 심사 리젝 시 대응
- 관광사업자 등록증 취득 (행정 절차)
- 개인정보처리방침 법률 검토 (변호사/전문가)
- 실제 기기 테스트 (물리적 디바이스)
- 서명 키(keystore, 인증서) 생성 및 안전 보관

---

*마지막 업데이트: 2026-03-18*
