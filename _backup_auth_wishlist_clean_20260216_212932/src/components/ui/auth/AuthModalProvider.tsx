"use client";

// ✅ 기존 코드가 "@/components/ui/auth/AuthModalProvider"를 import해도
// 실제 구현은 "../AuthModalProvider" 하나만 쓰도록 정리합니다.
export { default } from "../AuthModalProvider";
export { useAuthModal } from "../AuthModalProvider";
