import { gsap } from "gsap";

/**
 * Initializes a high-performance 3D perspective tilt effect on interactive cards
 * with dynamic specular spotlight sheen and spring returns.
 * Uses GSAP quickTo for silky 120fps tracking and physics-based release.
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
    card.dataset.tiltCard = "true";

    const originalTransform = card.style.transform;
    const originalTransition = card.style.transition;
    card.style.transformStyle = "preserve-3d";
    card.style.willChange = "transform";

    // Determine card tone for spotlight color
    const isDark =
      card.className.includes("Dark") ||
      card.className.includes("quoteCard") ||
      card.className.includes("balanceCard") ||
      card.className.includes("photoCard");

    card.style.setProperty(
      "--spotlight-color",
      isDark ? "rgba(176, 241, 14, 0.08)" : "rgba(255, 255, 255, 0.38)"
    );

    const xRotTo = gsap.quickTo(card, "rotationX", {
      duration: 0.3,
      ease: "power2.out",
    });
    const yRotTo = gsap.quickTo(card, "rotationY", {
      duration: 0.3,
      ease: "power2.out",
    });
    const scaleTo = gsap.quickTo(card, "scale", {
      duration: 0.3,
      ease: "power2.out",
    });

    // Subtle 3D pop on inner key focal elements
    const popElements = Array.from(
      card.querySelectorAll<HTMLElement>(
        "[class*='statValue'], [class*='balanceValue'], [class*='priceRow'], [class*='avatarStack']"
      )
    );

    const handleMouseMove = (e: MouseEvent) => {
      // Disable CSS transition during tracking for true 120fps fluidity
      card.style.transition = "none";

      const rect = card.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;
      const x = relX - rect.width / 2;
      const y = relY - rect.height / 2;

      // Update spotlight coordinates
      card.style.setProperty("--spotlight-x", `${Math.round(relX)}px`);
      card.style.setProperty("--spotlight-y", `${Math.round(relY)}px`);
      card.style.setProperty("--spotlight-opacity", "1");

      // Subtle tilt limit (4.2 degrees max for premium understated feel)
      const maxAngle = 4.2;
      const rotY = (x / (rect.width / 2)) * maxAngle;
      const rotX = -(y / (rect.height / 2)) * maxAngle;

      xRotTo(rotX);
      yRotTo(rotY);
      scaleTo(1.012);

      if (popElements.length > 0) {
        popElements.forEach((el) => {
          el.style.transform = "translateZ(8px)";
          el.style.transition = "transform 0.2s ease-out";
        });
      }
    };

    const handleMouseLeave = () => {
      // Fade out spotlight sheen
      card.style.setProperty("--spotlight-opacity", "0");

      if (popElements.length > 0) {
        popElements.forEach((el) => {
          el.style.transform = "translateZ(0px)";
        });
      }

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
          if (popElements.length > 0) {
            popElements.forEach((el) => {
              el.style.removeProperty("transform");
              el.style.removeProperty("transition");
            });
          }
        },
      });
    };

    card.addEventListener("mousemove", handleMouseMove, { passive: true });
    card.addEventListener("mouseleave", handleMouseLeave);

    cleanups.push(() => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
      delete card.dataset.tiltActive;
      delete card.dataset.tiltCard;
      card.style.removeProperty("--spotlight-opacity");
      card.style.removeProperty("--spotlight-x");
      card.style.removeProperty("--spotlight-y");
      card.style.removeProperty("--spotlight-color");
    });
  });

  return () => {
    cleanups.forEach((c) => c());
  };
}

