import { Hero } from "@/components/sections/Hero";
import { Transactions } from "@/components/sections/Transactions";
import { Features } from "@/components/sections/Features";
import { Habits } from "@/components/sections/Habits";
import { Pricing } from "@/components/sections/Pricing";
import { Faq } from "@/components/sections/Faq";
import { Footer } from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="ds-button sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 bg-lime-bright text-ink-canvas px-5 py-2.5 text-sm"
      >
        Skip to content
      </a>
      <main id="main">
        <Hero />
        <Transactions />
        <Features />
        <Habits />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
