"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "lenis/dist/lenis.css";

// Ensure ScrollTrigger is registered with GSAP
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function SmoothScroll() {
  useEffect(() => {
    // Initialize Lenis with smooth momentum lerp settings.
    // autoRaf is set to false so GSAP's ticker drives Lenis's RAF in lockstep.
    const lenis = new Lenis({
      autoRaf: false,
      lerp: 0.08, // Signature silky smooth momentum lag
      wheelMultiplier: 1.1,
      touchMultiplier: 1.5,
      smoothWheel: true,
      syncTouch: false, // Keep native touch on mobile for optimal mobile UX
      respectReducedMotion: false, // Prevents OS accessibility settings from disabling smooth scroll
    });

    // Synchronize Lenis scroll position with GSAP ScrollTrigger
    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    // Drive Lenis's animation frame on each GSAP ticker update
    const updateRaf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateRaf);

    // Disable lag smoothing in GSAP to prevent any delay in scroll animations
    gsap.ticker.lagSmoothing(0);

    // Coordinated debounced refresh for Lenis and ScrollTrigger
    let refreshRaf: number | null = null;
    const refreshAll = () => {
      if (refreshRaf !== null) cancelAnimationFrame(refreshRaf);
      refreshRaf = requestAnimationFrame(() => {
        lenis.resize();
        ScrollTrigger.refresh();
      });
    };

    // Expose lenis instance and refresh helper globally for cross-component sync
    (
      window as unknown as {
        __lenis?: Lenis;
        __refreshScroll?: () => void;
      }
    ).__lenis = lenis;
    (
      window as unknown as {
        __lenis?: Lenis;
        __refreshScroll?: () => void;
      }
    ).__refreshScroll = refreshAll;

    // Observe document body resizes (e.g. Accordion toggle, dynamic content)
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        refreshAll();
      });
      if (document.body) {
        resizeObserver.observe(document.body);
      }
    }

    // Global in-page anchor smooth scrolling (#hero, #transactions, #pricing, etc.)
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      try {
        const targetEl = document.querySelector(href);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl as HTMLElement, {
            offset: href === "#hero" ? 0 : -32,
            duration: 1.2,
          });
        }
      } catch {
        // Ignore invalid selectors
      }
    };

    document.addEventListener("click", handleAnchorClick);

    // Refresh ScrollTrigger and Lenis dimensions once fonts and window settle
    refreshAll();
    if (document.fonts?.ready) {
      document.fonts.ready.then(refreshAll);
    }
    window.addEventListener("load", refreshAll);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      window.removeEventListener("load", refreshAll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (refreshRaf !== null) {
        cancelAnimationFrame(refreshRaf);
      }
      gsap.ticker.remove(updateRaf);
      lenis.destroy();
      delete (
        window as unknown as {
          __lenis?: Lenis;
          __refreshScroll?: () => void;
        }
      ).__lenis;
      delete (
        window as unknown as {
          __lenis?: Lenis;
          __refreshScroll?: () => void;
        }
      ).__refreshScroll;
    };
  }, []);

  return null;
}
