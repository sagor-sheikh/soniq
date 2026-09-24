import { gsap } from "gsap";

/**
 * Adds an interactive magnetic hover attraction to primary buttons and key CTA elements.
 * Features dual-tier layered parallax: the outer button container gently gravitates towards
 * the cursor while inner labels/icons travel with higher velocity, creating an uncanny
 * tactile 3D floating feel. Snaps back with elastic spring physics on exit.
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
    "[class*='secondaryCta']",
    "[class*='mockupCta']",
    "[class*='planCta']",
  ];

  const buttons = Array.from(
    document.querySelectorAll<HTMLElement>(buttonSelectors.join(", "))
  );

  const cleanups: Array<() => void> = [];

  buttons.forEach((btn) => {
    if (btn.dataset.magneticActive === "true") return;
    btn.dataset.magneticActive = "true";

    const originalTransition = btn.style.transition;
    const xTo = gsap.quickTo(btn, "x", { duration: 0.28, ease: "power2.out" });
    const yTo = gsap.quickTo(btn, "y", { duration: 0.28, ease: "power2.out" });

    // Inner children for dual-tier depth parallax
    const innerElements = Array.from(btn.children) as HTMLElement[];
    const innerQuickTos = innerElements.map((child) => ({
      x: gsap.quickTo(child, "x", { duration: 0.32, ease: "power2.out" }),
      y: gsap.quickTo(child, "y", { duration: 0.32, ease: "power2.out" }),
      el: child,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      btn.style.transition = "none";
      const rect = btn.getBoundingClientRect();
      const distX = e.clientX - (rect.left + rect.width / 2);
      const distY = e.clientY - (rect.top + rect.height / 2);

      const x = distX * 0.18;
      const y = distY * 0.18;
      xTo(x);
      yTo(y);

      // Inner elements move slightly faster for tactile 3D relief
      innerQuickTos.forEach((t) => {
        t.x(distX * 0.28);
        t.y(distY * 0.28);
      });
    };

    const handleMouseDown = () => {
      gsap.to(btn, { scale: 0.96, duration: 0.12, ease: "power2.out" });
    };

    const handleMouseUp = () => {
      gsap.to(btn, { scale: 1, duration: 0.3, ease: "back.out(2)" });
    };

    const handleMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.65,
        ease: "elastic.out(1.15, 0.45)",
        overwrite: "auto",
        onComplete: () => {
          btn.style.transition = originalTransition;
        },
      });

      if (innerElements.length > 0) {
        gsap.to(innerElements, {
          x: 0,
          y: 0,
          duration: 0.65,
          ease: "elastic.out(1.2, 0.4)",
          overwrite: "auto",
        });
      }
    };

    btn.addEventListener("mousemove", handleMouseMove, { passive: true });
    btn.addEventListener("mousedown", handleMouseDown);
    btn.addEventListener("mouseup", handleMouseUp);
    btn.addEventListener("mouseleave", handleMouseLeave);

    cleanups.push(() => {
      btn.removeEventListener("mousemove", handleMouseMove);
      btn.removeEventListener("mousedown", handleMouseDown);
      btn.removeEventListener("mouseup", handleMouseUp);
      btn.removeEventListener("mouseleave", handleMouseLeave);
      delete btn.dataset.magneticActive;
    });
  });

  return () => {
    cleanups.forEach((c) => c());
  };
}

