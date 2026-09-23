import { gsap } from "gsap";

/**
 * Initializes a high-performance 3D perspective tilt effect on interactive cards
 * using GSAP quickTo for fluid 120fps tracking and spring returns.
 * Only activated on devices with fine pointer and hover capability.
 */
export function initCardTilt(): () => void {
  if (typeof window === "undefined") return () => {};

  // Only enable on desktop pointer devices
  const isFinePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;
  if (!isFinePointer) return () => {};

  // Select key interactive cards across sections
  const cardSelectors = [
    // Hero stat cards
    "[class*='statCard']",
    // Transactions cards
    "[class*='balanceCard']",
    "[class*='planCard']",
    // Habits cards
    "[class*='photoCard']",
    "[class*='quoteCard']",
    // Pricing cards
    "[class*='cardLime']",
    "[class*='cardCream']",
  ];

  const cards = Array.from(
    document.querySelectorAll<HTMLElement>(cardSelectors.join(", "))
  );

  const cleanups: Array<() => void> = [];

  cards.forEach((card) => {
    // Avoid double initialization
    if (card.dataset.tiltActive === "true") return;
    card.dataset.tiltActive = "true";

    const originalTransform = card.style.transform;
    const originalTransition = card.style.transition;
    card.style.transformStyle = "preserve-3d";
    card.style.willChange = "transform";

    const xRotTo = gsap.quickTo(card, "rotationX", {
      duration: 0.28,
      ease: "power2.out",
    });
    const yRotTo = gsap.quickTo(card, "rotationY", {
      duration: 0.28,
      ease: "power2.out",
    });
    const scaleTo = gsap.quickTo(card, "scale", {
      duration: 0.28,
      ease: "power2.out",
    });

    const handleMouseMove = (e: MouseEvent) => {
      // Disable CSS transition during tracking for true 120fps fluidity
      card.style.transition = "none";

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Subtle tilt limit (4.5 degrees max for premium understated feel)
      const maxAngle = 4.5;
      const rotY = (x / (rect.width / 2)) * maxAngle;
      const rotX = -(y / (rect.height / 2)) * maxAngle;

      xRotTo(rotX);
      yRotTo(rotY);
      scaleTo(1.015);
    };

    const handleMouseLeave = () => {
      // Smooth spring back to resting state
      gsap.to(card, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        duration: 0.65,
        ease: "power2.out",
        overwrite: "auto",
        onComplete: () => {
          card.style.transform = originalTransform;
          card.style.transition = originalTransition;
        },
      });
    };

    card.addEventListener("mousemove", handleMouseMove, { passive: true });
    card.addEventListener("mouseleave", handleMouseLeave);

    cleanups.push(() => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
      delete card.dataset.tiltActive;
    });
  });

  return () => {
    cleanups.forEach((c) => c());
  };
}
