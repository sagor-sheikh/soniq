import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Initializes continuous ambient micro-motion (breathing glow ellipses,
 * zero-gravity floating badges, subtle texture drifts, and parallax scrubs)
 * to give the page a living, high-end fintech atmosphere.
 */
export function initAmbientMotion(): () => void {
  if (typeof window === "undefined") return () => {};

  const cleanups: Array<() => void> = [];
  const triggers: ScrollTrigger[] = [];
  const tweens: gsap.core.Tween[] = [];

  // 1. Hero background glow organic pulse
  const heroGlow = document.querySelector<HTMLElement>("[class*='backgroundGlow']");
  if (heroGlow) {
    const t = gsap.to(heroGlow, {
      opacity: 0.82,
      duration: 7.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    tweens.push(t);
  }

  // 2. Ambient breathing / floating on Transactions mockup ellipses & balance glow
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

  // 3. Floating zero-G badges in Transactions mockup
  const badgeExpense = document.querySelector<HTMLElement>("[class*='badgeExpense']");
  const badgeIncome = document.querySelector<HTMLElement>("[class*='badgeIncome']");

  if (badgeExpense) {
    const t = gsap.to(badgeExpense, {
      y: -6,
      rotation: -0.8,
      duration: 4.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    tweens.push(t);
  }

  if (badgeIncome) {
    const t = gsap.to(badgeIncome, {
      y: 6,
      rotation: 0.8,
      duration: 4.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.6,
    });
    tweens.push(t);
  }

  // 4. Subtle textural counter-drift inside Balance card
  const textureLarge = document.querySelector<HTMLElement>("[class*='balanceTextureLarge']");
  const textureSmall = document.querySelector<HTMLElement>("[class*='balanceTextureSmall']");

  if (textureLarge) {
    const t = gsap.to(textureLarge, {
      y: -5,
      rotation: 1.5,
      duration: 6.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    tweens.push(t);
  }

  if (textureSmall) {
    const t = gsap.to(textureSmall, {
      y: 5,
      rotation: -1.5,
      duration: 5.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: 0.7,
    });
    tweens.push(t);
  }

  // 5. Habits quote icon gentle breathing
  const quoteIcon = document.querySelector<HTMLElement>("[class*='quoteIcon']");
  if (quoteIcon) {
    const t = gsap.to(quoteIcon, {
      y: -3,
      scale: 1.03,
      duration: 3.8,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
    tweens.push(t);
  }

  // 6. Footer giant decorative "Soniq" wordmark ScrollTrigger parallax scrub
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

  // 7. Subtle parallax on features image
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

  // 8. Partner Logos continuous infinite looping carousel
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

