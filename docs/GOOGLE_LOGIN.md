# Google 로그인 설정

NextAuth에 Google Provider가 이미 연결되어 있습니다. 아래만 설정하면 로그인 버튼으로 실제 Google 계정 연동이 동작합니다.

---

## 1. Google Cloud Console에서 OAuth 클라이언트 만들기

1. [Google Cloud Console](https://console.cloud.google.com/) 접속 후 프로젝트 선택(또는 새 프로젝트 생성).
2. **API 및 서비스** → **사용자 인증 정보** → **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**.
3. 동의 화면이 없다면 먼저 **OAuth 동의 화면**에서 앱 이름·이메일 등 최소 정보 설정.
4. **애플리케이션 유형**: **웹 애플리케이션**.
5. **승인된 리디렉션 URI**에 다음을 추가:
   - 로컬: `http://localhost:3001/api/auth/callback/google` (사용 포트에 맞게 `3001` 변경)
   - 운영: `https://yourdomain.com/api/auth/callback/google`
6. 만들기 후 **클라이언트 ID**와 **클라이언트 보안 비밀**을 복사.

---

## 2. 환경 변수 설정

`.env.local`에 다음을 넣습니다.

```env
# NextAuth (필수)
NEXTAUTH_URL=http://localhost:3001
AUTH_SECRET=아무거나_32자_이상_랜덤_문자열

# Google OAuth
GOOGLE_CLIENT_ID=복사한_클라이언트_ID
GOOGLE_CLIENT_SECRET=복사한_클라이언트_보안_비밀
```

- **NEXTAUTH_URL**: 실제 접속 URL과 일치해야 합니다. 로컬이면 `http://localhost:3001`(또는 사용 중인 포트).
- **AUTH_SECRET**: `openssl rand -base64 32` 로 생성해도 됩니다.
- 운영 환경에서는 `NEXTAUTH_URL=https://yourdomain.com` 으로 설정하고, Google 리디렉션 URI에도 해당 도메인을 등록해야 합니다.

---

## 3. 동작 확인

1. `npm run dev` 로 서버 실행.
2. 로그인 버튼(구글로 계속하기) 클릭 → Google 로그인 화면 → 로그인 후 앱으로 복귀.
3. 로그인된 사용자는 DB `User` 테이블에 자동 생성/업데이트됩니다.

---

## 데모 로그인(개발용)

Google/Kakao/Line을 설정하지 않고 로그인만 테스트하려면:

```env
KSTAY_ENABLE_DEMO_AUTH=true
```

- **주의**: `NODE_ENV=production` 이면 데모 인증은 비활성화됩니다.
- 로그인 페이지 대신 쿠키 `kst_role`(guest / host / admin)로 역할만 바꾸는 방식은 현재 코드에서 별도 UI가 없을 수 있으므로, 실제 OAuth 설정을 권장합니다.

---

## 참고

- Kakao / LINE 로그인: `KAKAO_CLIENT_ID`, `LINE_CLIENT_ID` 등이 있으면 로그인 모달에 버튼이 노출되며, 각 개발자 콘솔에서 앱 생성 후 리디렉션 URI를 `.../api/auth/callback/kakao`, `.../api/auth/callback/line` 으로 등록하면 됩니다.
- 관리자 지정: `official.kstay@gmail.com` 또는 `ADMIN_EMAILS` 환경 변수에 넣은 이메일로 Google 로그인 시 자동으로 ADMIN 역할이 부여됩니다.
