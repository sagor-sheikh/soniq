import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Initializes continuous ambient micro-motion (breathing glow ellipses,
 * parallax footer wordmark, and subtle card floats) to give the page
 * a living, high-end fintech atmosphere.
 */
export function initAmbientMotion(): () => void {
  if (typeof window === "undefined") return () => {};

  const cleanups: Array<() => void> = [];
  const triggers: ScrollTrigger[] = [];
  const tweens: gsap.core.Tween[] = [];

  // 1. Ambient breathing / floating on Transactions mockup ellipses & balance glow
  const ellipseTop = document.querySelector<HTMLElement>("[class*='mockupEllipseTop']");
  const ellipseBottom = document.querySelector<HTMLElement>("[class*='mockupEllipseBottom']");
  const balanceGlow = document.querySelector<HTMLElement>("[class*='balanceGlow']");

  if (ellipseTop) {
    const t = gsap.to(ellipseTop, {
      y: -14,
      x: 8,
      rotation: 1.5,
      duration: 5.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    tweens.push(t);
  }

  if (ellipseBottom) {
    const t = gsap.to(ellipseBottom, {
      y: 12,
      x: -6,
      rotation: -1.2,
      duration: 6.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.8,
    });
    tweens.push(t);
  }

  if (balanceGlow) {
    const t = gsap.to(balanceGlow, {
      scale: 1.08,
      opacity: 0.9,
      duration: 4.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    tweens.push(t);
  }

  // 2. Footer giant decorative "Soniq" wordmark ScrollTrigger parallax scrub
  const wordmark = document.querySelector<HTMLElement>("[data-decorative='wordmark']");
  if (wordmark) {
    const footer = wordmark.closest("footer");
    if (footer) {
      const tween = gsap.fromTo(
        wordmark,
        { yPercent: 0, opacity: 0.75 },
        {
          yPercent: 6,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: footer,
            start: "top bottom",
            end: "bottom bottom",
            scrub: 0.6,
          },
        }
      );
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    }
  }

  // 3. Subtle parallax on features image
  const featuresPhoto = document.querySelector<HTMLElement>("[class*='photoImage']");
  if (featuresPhoto) {
    const featuresSection = document.querySelector<HTMLElement>("#features");
    if (featuresSection) {
      const tween = gsap.fromTo(
        featuresPhoto,
        { yPercent: -4, scale: 1.04 },
        {
          yPercent: 4,
          scale: 1.02,
          ease: "none",
          scrollTrigger: {
            trigger: featuresSection,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.8,
          },
        }
      );
      if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
    }
  }

  // 4. Partner Logos continuous infinite looping carousel
  const logoTrack = document.querySelector<HTMLElement>("[data-logo-carousel]");
  if (logoTrack) {
    gsap.set(logoTrack, { xPercent: 0 });

    const tween = gsap.to(logoTrack, {
      xPercent: -50,
      ease: "none",
      duration: 26,
      repeat: -1,
    });
    tweens.push(tween);

    const parent = logoTrack.parentElement;
    if (parent) {
      const onEnter = () =>
        gsap.to(tween, { timeScale: 0.25, duration: 0.5, ease: "power1.out" });
      const onLeave = () =>
        gsap.to(tween, { timeScale: 1, duration: 0.5, ease: "power1.out" });
      parent.addEventListener("mouseenter", onEnter);
      parent.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        parent.removeEventListener("mouseenter", onEnter);
        parent.removeEventListener("mouseleave", onLeave);
      });
    }
  }

  return () => {
    tweens.forEach((t) => t.kill());
    triggers.forEach((tr) => tr.kill());
    cleanups.forEach((c) => c());
  };
}
