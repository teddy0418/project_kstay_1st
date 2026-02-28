/**
 * 인앱 브라우저 감지 (카카오톡, 라인, 왓츠앱, 페이스북 등).
 * 구글 로그인 등이 차단되는 환경에서 시스템 브라우저로 유도하기 위함.
 */

const IN_APP_UA_PATTERNS = [
  /KAKAOTALK/i,
  /KAKAO/i,
  /Line\//i,
  /LINE\//i,
  /WhatsApp/i,
  /FBAN\/|FBAV\//i, // Facebook in-app
  /FB_IAB/i,
  /Instagram/i,
  /NAVER.*inapp/i,
  /Daum.*inapp/i,
  /Snapchat/i,
  /TwitterAndroid/i,
  /TikTok/i,
];

const ANDROID_UA = /Android/i;
const IOS_UA = /iPhone|iPad|iPod/i;

export function isInApp(userAgent?: string): boolean {
  const ua = userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return IN_APP_UA_PATTERNS.some((p) => p.test(ua));
}

export function isAndroid(userAgent?: string): boolean {
  const ua = userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return ANDROID_UA.test(ua);
}

export function isIOS(userAgent?: string): boolean {
  const ua = userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return IOS_UA.test(ua);
}

const KSTAY_RETURN_URL_KEY = "kstay_inapp_return_url";

/** 현재 페이지 URL을 로컬 스토리지에 저장 (외부 브라우저에서 복원용) */
export function saveReturnUrl(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KSTAY_RETURN_URL_KEY, window.location.href);
  } catch {}
}

/** 저장된 URL 반환 후 삭제 (한 번만 복원) */
export function consumeReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = window.localStorage.getItem(KSTAY_RETURN_URL_KEY);
    if (url) window.localStorage.removeItem(KSTAY_RETURN_URL_KEY);
    return url;
  } catch {
    return null;
  }
}

/**
 * 안드로이드 인앱 브라우저에서 현재 URL을 시스템 기본 브라우저(Chrome 등)로 열기 위한 intent URL.
 * scheme=https + S.browser_fallback_url 로 fallback 시 같은 URL이 기본 브라우저에서 열림.
 * 사용: location.href = getAndroidIntentRedirectUrl(window.location.href)
 */
export function getAndroidIntentRedirectUrl(fullUrl: string): string {
  try {
    const u = new URL(fullUrl);
    const hostPath = u.host + u.pathname + u.search;
    const encoded = encodeURIComponent(fullUrl);
    return `intent://${hostPath}#Intent;scheme=https;S.browser_fallback_url=${encoded};end`;
  } catch {
    return fullUrl;
  }
}
