"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initCardTilt } from "./tilt";
import { initMagneticButtons } from "./magnetic";
import { initAmbientMotion } from "./ambient";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const REVEAL_SELECTOR = "[data-reveal]";
const PARALLAX_SELECTOR = "[data-parallax]";
const COUNTUP_SELECTOR = "[data-countup]";
const BG_VIDEO_SELECTOR = "[data-bg-video]";

const COUNT_DURATION = 1.6;

/**
 * Counts up to a target number using GSAP with exact label formatting preserved.
 */
function animateCount(el: HTMLElement, done?: () => void) {
  if (el.dataset.countupStarted === "true") return;
  el.dataset.countupStarted = "true";

  const finalText = el.dataset.countupText ?? el.textContent?.trim() ?? "";
  const match = finalText.match(/^(\D*?)([\d.,]+)(\D*)$/);
  if (!match) {
    if (done) done();
    return;
  }
  const [, prefix, rawNumber, suffix] = match;
  const target = Number(rawNumber.replace(/,/g, ""));
  if (!Number.isFinite(target)) {
    if (done) done();
    return;
  }
  const decimals = (rawNumber.split(".")[1] ?? "").length;
  const grouped = rawNumber.includes(",");
  el.dataset.countupText = finalText;

  const proxy = { val: 0 };
  gsap.to(proxy, {
    val: target,
    duration: COUNT_DURATION,
    ease: "power2.out",
    onUpdate: () => {
      const shown = grouped
        ? proxy.val.toLocaleString(undefined, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })
        : proxy.val.toFixed(decimals);
      el.textContent = `${prefix}${shown}${suffix}`;
    },
    onComplete: () => {
      el.textContent = finalText;
      if (done) done();
    },
  });
}

export function MotionRoot() {
  useEffect(() => {
    const root = document.documentElement;

    // Initialize motion layer
    if (typeof window === "undefined") return;

    root.dataset.motion = "on";

    const revealTargets = Array.from(
      document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR),
    );
    const countTargets = new Set(
      document.querySelectorAll<HTMLElement>(COUNTUP_SELECTOR),
    );
    const parallaxTargets = Array.from(
      document.querySelectorAll<HTMLElement>(PARALLAX_SELECTOR),
    );
    const videoTargets = Array.from(
      document.querySelectorAll<HTMLVideoElement>(BG_VIDEO_SELECTOR),
    );

    const triggers: ScrollTrigger[] = [];
    const elementTriggers = new Map<HTMLElement, ScrollTrigger>();

    // Trigger reveal on an element with silky, calibrated GSAP tween
    const revealElement = (el: HTMLElement) => {
      if (el.dataset.revealed === "true") return;
      el.dataset.revealed = "true";

      // Clean up any pending ScrollTrigger and IntersectionObserver for this element
      const existingTrigger = elementTriggers.get(el);
      if (existingTrigger) {
        existingTrigger.kill();
        elementTriggers.delete(el);
      }
      observer.unobserve(el);

      const isLead = el.getAttribute("data-reveal") === "lead";
      const delayStep = Number(el.dataset.revealDelay) || 0;
      const delay = delayStep * 0.08;
      const travel = isLead ? 40 : 24;

      // Disable CSS transition during GSAP tween to eliminate jitter
      el.style.transition = "none";

      gsap.fromTo(
        el,
        { opacity: 0, y: travel },
        {
          opacity: 1,
          y: 0,
          duration: isLead ? 0.95 : 0.85,
          delay,
          ease: "power3.out",
          force3D: true,
          onComplete: () => {
            el.style.removeProperty("will-change");
            el.style.removeProperty("transform");
            el.style.removeProperty("opacity");
            el.style.removeProperty("transition");
          },
        },
      );

      // Micro-stagger child items if present for a luxurious cascade
      const txRows = el.querySelectorAll<HTMLElement>("[class*='txItem']");
      if (txRows.length > 0) {
        gsap.fromTo(
          txRows,
          { opacity: 0, x: -12 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.07,
            delay: delay + 0.15,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
        );
      }

      const stars = el.querySelectorAll<HTMLElement>("[class*='star']");
      if (stars.length > 0) {
        gsap.fromTo(
          stars,
          { scale: 0.4, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            stagger: 0.05,
            delay: delay + 0.2,
            ease: "back.out(1.8)",
            clearProps: "transform,opacity",
          },
        );
      }

      const featureItems = el.querySelectorAll<HTMLElement>(
        "[class*='featureList'] > li",
      );
      if (featureItems.length > 0) {
        gsap.fromTo(
          featureItems,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.45,
            stagger: 0.04,
            delay: delay + 0.18,
            ease: "power2.out",
            clearProps: "transform,opacity",
          },
        );
      }

      // Find any count-up counters inside this revealed element
      const innerCounters = Array.from(
        el.querySelectorAll<HTMLElement>(COUNTUP_SELECTOR),
      );
      if (countTargets.has(el)) {
        innerCounters.push(el);
      }

      innerCounters.forEach((counter, idx) => {
        if (countTargets.has(counter)) {
          countTargets.delete(counter);
          gsap.delayedCall(delay + 0.15 + idx * 0.08, () => {
            animateCount(counter);
          });
        }
      });
    };

    // ---- 1. IntersectionObserver for fast viewport entry detection ----------
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          revealElement(el);
        }
      },
      { rootMargin: "0px 0px -5% 0px", threshold: 0.05 },
    );

    // ---- 2. GSAP ScrollTrigger for reveals & smooth entrance ----------------
    revealTargets.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.85;

      if (inView) {
        revealElement(el);
      } else {
        observer.observe(el);
        const trigger = ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () => {
            revealElement(el);
          },
        });
        triggers.push(trigger);
        elementTriggers.set(el, trigger);
      }
    });

    // Standalone countup targets that are not inside a revealed element
    const standaloneCounters = Array.from(countTargets).filter(
      (el) => !el.closest(REVEAL_SELECTOR),
    );

    standaloneCounters.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        countTargets.delete(el);
        gsap.delayedCall(0.3, () => animateCount(el));
      } else {
        const trigger = ScrollTrigger.create({
          trigger: el,
          start: "top 90%",
          once: true,
          onEnter: () => {
            if (countTargets.has(el)) {
              countTargets.delete(el);
              animateCount(el);
            }
          },
        });
        triggers.push(trigger);
      }
    });

    // ---- 3. GSAP ScrollTrigger Parallax -------------------------------------
    parallaxTargets.forEach((el) => {
      const depth = Number(el.dataset.parallax) || 0;
      const section = el.closest("section") || el.parentElement || el;
      el.style.transition = "none";
      el.style.willChange = "transform";

      const tween = gsap.fromTo(
        el,
        { y: -depth * 0.5 },
        {
          y: depth * 0.5,
          ease: "none",
          force3D: true,
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );

      if (tween.scrollTrigger) {
        triggers.push(tween.scrollTrigger);
      }
    });

    // ---- 4. Ambient Background Video Playback -------------------------------
    const videoObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (!entry.isIntersecting) {
            video.pause();
            continue;
          }
          if (!video.getAttribute("src") && video.dataset.src) {
            video.addEventListener(
              "loadeddata",
              () => {
                video.dataset.ready = "true";
              },
              { once: true },
            );
            video.setAttribute("src", video.dataset.src);
          }
          void video.play().catch(() => {});
        }
      },
      { rootMargin: "200px 0px" },
    );
    for (const video of videoTargets) videoObserver.observe(video);

    // ---- 5. Completeness Guard for Stranded Elements ------------------------
    const releaseStranded = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (window.scrollY < scrollable - 2) return false;
      let released = false;
      for (const el of revealTargets) {
        if (el.dataset.revealed === "true") continue;
        revealElement(el);
        released = true;
      }
      return released;
    };

    releaseStranded();
    window.addEventListener("scroll", releaseStranded, { passive: true });
    window.addEventListener("resize", releaseStranded, { passive: true });

    // ---- 6. Initialize Luxury Motion Suites (Tilt, Magnetic, Ambient) --------
    const cleanupTilt = initCardTilt();
    const cleanupMagnetic = initMagneticButtons();
    const cleanupAmbient = initAmbientMotion();

    // Initial refresh on mount
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });

    // Refresh ScrollTrigger once fonts and layout settle
    const syncRefresh = () => {
      const globalRefresh = (
        window as unknown as { __refreshScroll?: () => void }
      ).__refreshScroll;
      if (globalRefresh) {
        globalRefresh();
      } else {
        ScrollTrigger.refresh();
      }
    };

    if (document.fonts?.ready) {
      document.fonts.ready.then(syncRefresh);
    }
    window.addEventListener("load", syncRefresh);

    return () => {
      window.removeEventListener("scroll", releaseStranded);
      window.removeEventListener("resize", releaseStranded);
      window.removeEventListener("load", syncRefresh);
      cleanupTilt();
      cleanupMagnetic();
      cleanupAmbient();
      observer.disconnect();
      videoObserver.disconnect();
      elementTriggers.forEach((t) => t.kill());
      triggers.forEach((t) => t.kill());
      for (const video of videoTargets) video.pause();
      delete root.dataset.motion;
    };
  }, []);

  return null;
}
