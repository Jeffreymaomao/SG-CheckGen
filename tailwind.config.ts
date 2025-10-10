import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Noto Sans TC'", "'Noto Sans'", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
