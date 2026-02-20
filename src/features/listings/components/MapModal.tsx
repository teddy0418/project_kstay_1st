"use client";

import { useState } from "react";
import { Copy, MapPin, X } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";
import { useI18n } from "@/components/ui/LanguageProvider";

export default function MapModal({
  address,
  lat,
  lng,
}: {
  address: string;
  lat: number;
  lng: number;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { lang } = useI18n();
  const c =
    lang === "ko"
      ? {
          copied: "주소를 복사했습니다",
          copyFailed: "복사에 실패했습니다",
          viewMap: "지도 보기",
          location: "위치",
          close: "닫기",
          copy: "복사",
          note: "MVP 안내: 추후 Google Maps 팝업(API 키)으로 교체할 수 있습니다.",
        }
      : lang === "ja"
        ? {
            copied: "住所をコピーしました",
            copyFailed: "コピーに失敗しました",
            viewMap: "地図を見る",
            location: "場所",
            close: "閉じる",
            copy: "コピー",
            note: "MVP注記: 後で Google Maps ポップアップ(APIキー)に置き換え可能です。",
          }
        : lang === "zh"
          ? {
              copied: "地址已复制",
              copyFailed: "复制失败",
              viewMap: "查看地图",
              location: "位置",
              close: "关闭",
              copy: "复制",
              note: "MVP 说明：后续可替换为 Google Maps 弹窗（API key）。",
            }
          : {
              copied: "Address copied",
              copyFailed: "Copy failed",
              viewMap: "View map",
              location: "Location",
              close: "Close",
              copy: "Copy",
              note: "MVP note: Google Maps popup can replace this later (API key).",
            };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast(c.copied);
    } catch {
      toast(c.copyFailed);
    }
  };

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50"
      >
        <MapPin className="h-4 w-4" />
        {c.viewMap}
      </button>

      {open && (
        <div className="fixed inset-0 z-[90] bg-black/45" onClick={() => setOpen(false)}>
          <div
            className="absolute left-1/2 top-1/2 w-[min(900px,calc(100%-24px))] max-h-[calc(100vh-48px)] -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white shadow-elevated overflow-hidden flex flex-col md:max-h-[90vh] lg:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between px-4 py-3 border-b border-neutral-200 md:px-6 md:py-4">
              <div className="text-sm font-semibold">{c.location}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
                aria-label={c.close}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-1 flex-col overflow-auto px-4 py-3 md:px-6 md:py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-sm text-neutral-700 min-w-0">{address}</div>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50"
                >
                  <Copy className="h-4 w-4" />
                  {c.copy}
                </button>
              </div>

              <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 h-[220px] md:h-[320px] lg:h-[420px]">
                <iframe title="map" src={src} className="h-full w-full" />
              </div>

              <p className="mt-3 text-xs text-neutral-500">
                {c.note}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
