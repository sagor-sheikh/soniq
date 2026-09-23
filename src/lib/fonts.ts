import localFont from "next/font/local";

export const satoshi = localFont({
  src: [
    {
      path: "../fonts/Satoshi-400.woff2",
      weight: "400",
    },
    {
      path: "../fonts/Satoshi-500.woff2",
      weight: "500",
    },
  ],
  variable: "--font-body",
  display: "swap",
  preload: true,
});

export const interTight = localFont({
  src: "../fonts/InterTight-Variable.woff2",
  variable: "--font-display",
  display: "swap",
  preload: true,
});
