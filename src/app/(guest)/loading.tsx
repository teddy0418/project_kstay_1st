import { getServerLang } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n";

export default async function GuestLoading() {
  const lang = await getServerLang();
  const text = translate(lang, "loading");
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        <p className="text-sm text-neutral-500">{text}</p>
      </div>
    </div>
  );
}
