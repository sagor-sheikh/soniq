import { gsap } from "gsap";

/**
 * Adds an interactive magnetic hover attraction to primary buttons and key CTA elements.
 * When the pointer approaches or hovers the button, it gently gravitates towards the cursor,
 * and snaps back with an elastic/spring curve when leaving.
 */
export function initMagneticButtons(): () => void {
  if (typeof window === "undefined") return () => {};

  const isFinePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;
  if (!isFinePointer) return () => {};

  const buttonSelectors = [
    ".ds-button",
    "[class*='cta']",
    "[class*='socialLink']",
    "[class*='navCta']",
  ];

  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>(buttonSelectors.join(", "))
  );

  const cleanups: Array<() => void> = [];

  buttons.forEach((btn) => {
    if (btn.dataset.magneticActive === "true") return;
    btn.dataset.magneticActive = "true";

    const originalTransition = btn.style.transition;
    const xTo = gsap.quickTo(btn, "x", { duration: 0.25, ease: "power2.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.25, ease: "power2.out" });

    const handleMouseMove = (e: MouseEvent) => {
      btn.style.transition = "none";
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) * 0.22;
      const y = (e.clientY - (rect.top + rect.height / 2)) * 0.22;
      xTo(x);
      yTo(y);
    };

    const handleMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.55,
        ease: "elastic.out(1.1, 0.4)",
        overwrite: "auto",
        onComplete: () => {
          btn.style.transition = originalTransition;
        },
      });
    };

    btn.addEventListener("mousemove", handleMouseMove, { passive: true });
    btn.addEventListener("mouseleave", handleMouseLeave);

    cleanups.push(() => {
      btn.removeEventListener("mousemove", handleMouseMove);
      btn.removeEventListener("mouseleave", handleMouseLeave);
      delete btn.dataset.magneticActive;
    });
  });

  return () => {
    cleanups.forEach((c) => c());
  };
}
