import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./sanity/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'pcm-blue': '#004a8e', // Biru PCM resmi
        'pcm-gold': '#ffc107', // Kuning Matahari PCM
      },
      // INTEGRASI FONT ARAB
      fontFamily: {
        amiri: ['var(--font-amiri)', 'serif'],
        'noto-arabic': ['var(--font-noto-arabic)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;