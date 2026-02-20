import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/types/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        // Browse: show 목록/지도 tabs below this; desktop two-column above (배포/모바일 뷰포트 대비 넉넉하게)
        browseDesktop: "1920px",
      },
      colors: {
        brand: {
          DEFAULT: "hsl(var(--brand) / <alpha-value>)",
          foreground: "hsl(var(--brand-foreground) / <alpha-value>)",
          soft: "hsl(var(--brand-soft) / <alpha-value>)",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0,0,0,0.06)",
        elevated: "0 10px 30px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};

export default config;
