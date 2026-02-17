export type Lang = "en" | "ko" | "ja" | "zh";

export type BoardPost = {
  id: string;
  cover: string;
  createdAt: string;
  title: Record<Lang, string>;
  excerpt: Record<Lang, string>;
  content: Record<Lang, string>;
};

export const BOARD_POSTS: BoardPost[] = [
  {
    id: "1",
    cover: "https://images.unsplash.com/photo-1548940740-204726a19be3?auto=format&fit=crop&w=1400&q=60",
    createdAt: "2026-02-10T10:00:00Z",
    title: {
      en: "5 must-try foods in Busan",
      ko: "부산에서 꼭 먹어야 할 음식 5가지",
      ja: "釜山で絶対食べたいグルメ5選",
      zh: "釜山必吃美食 5 选",
    },
    excerpt: {
      en: "Quick guide for first-time visitors.",
      ko: "처음 방문한 외국인도 쉽게 따라 하는 맛집 가이드.",
      ja: "初めての方でも安心なグルメガイド。",
      zh: "第一次来釜山也能轻松跟着吃的指南。",
    },
    content: {
      en: "If you're visiting Busan, start with seafood near Jagalchi Market, then try milmyeon (wheat noodles), pork soup (dwaeji-gukbap), hotteok, and fresh sashimi.",
      ko: "부산에 왔다면 자갈치시장 근처 해산물부터 시작해서, 밀면·돼지국밥·씨앗호떡·회까지 코스로 즐겨보세요.",
      ja: "釜山ならジャガルチ市場周辺の海鮮、ミルミョン、デジクッパ、ホットク、刺身がおすすめです。",
      zh: "来釜山可以从札嘎其市场附近的海鲜开始，再尝尝小麦面、猪肉汤饭、糖饼和生鱼片。",
    },
  },
  {
    id: "2",
    cover: "https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=1400&q=60",
    createdAt: "2026-02-12T10:00:00Z",
    title: {
      en: "How to use Kakao T like a local",
      ko: "카카오T를 현지인처럼 쓰는 방법",
      ja: "カカオTをローカルのように使うコツ",
      zh: "像当地人一样使用 Kakao T 的方法",
    },
    excerpt: {
      en: "Taxi tips + translation shortcuts.",
      ko: "택시 팁 + 번역 꿀팁까지 한 번에!",
      ja: "タクシーのコツ＋翻訳ショートカット。",
      zh: "打车技巧 + 翻译小窍门。",
    },
    content: {
      en: "Use Kakao T for reliable taxis. Save your destination in Korean and show it to the driver. For late-night rides, confirm the pickup point before requesting.",
      ko: "카카오T로 택시를 부르면 가장 안정적입니다. 목적지를 한글로 저장해두고 기사님께 보여주면 실수가 줄어요. 심야에는 탑승 위치를 먼저 확인하고 호출하세요.",
      ja: "カカオTでタクシー手配が最も確実です。行き先は韓国語で保存して運転手に見せると安心。深夜は乗車地点を確認してから呼びましょう。",
      zh: "使用 Kakao T 叫车更可靠。把目的地保存为韩文并给司机看。深夜出行前先确认上车点再叫车。",
    },
  },
];

export function getBoardPosts() {
  return BOARD_POSTS;
}

export function getBoardPost(id: string) {
  return BOARD_POSTS.find((p) => p.id === id) ?? null;
}
