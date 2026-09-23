import type { Metadata } from "next";
import { satoshi, interTight } from "@/lib/fonts";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { MotionProvider } from "@/components/motion/MotionProvider";
import "lenis/dist/lenis.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soniq — Get Your Financial Future Under Control",
  description:
    "Take control of your financial future with Soniq's comprehensive financial planning and management platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${satoshi.variable} ${interTight.variable} antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MotionProvider>
          {children}
          <SmoothScroll />
          <MotionRoot />
        </MotionProvider>
      </body>
    </html>
  );
}
