"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import arrowIcon from "../../../public/assets/55b3371cda2543530751d1c3f8a1b5550d0ef7cec37de699eea89d40af8efdaa.svg";
import styles from "@/components/sections/Faq.module.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export type AccordionItemData = {
  id: string;
  question: string;
  answer: string | null;
};

type AccordionProps = {
  items: AccordionItemData[];
  initialOpenId: string;
};

function AccordionItemComponent({
  item,
  isOpen,
  onToggle,
}: {
  item: AccordionItemData;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const isFirstMount = useRef(true);

  const buttonId = `${item.id}-btn`;
  const panelId = `${item.id}-panel`;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    const panel = panelRef.current;
    const icon = iconRef.current;

    if (!wrapper || !inner || !panel) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Handle initial state on first mount without transition flash
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (isOpen && item.answer) {
        gsap.set(wrapper, { height: "auto", display: "block", overflow: "visible" });
        gsap.set(panel, { opacity: 1, y: 0 });
        if (icon) gsap.set(icon, { rotation: 180 });
      } else {
        gsap.set(wrapper, { height: 0, display: "none", overflow: "hidden" });
        gsap.set(panel, { opacity: 0, y: -8 });
        if (icon) gsap.set(icon, { rotation: 0 });
      }
      return;
    }

    if (isOpen && item.answer) {
      // 1. Rotate arrow smoothly with GSAP
      if (icon) {
        gsap.killTweensOf(icon);
        gsap.to(icon, {
          rotation: 180,
          duration: prefersReducedMotion ? 0 : 0.44,
          ease: "power3.out",
        });
      }

      gsap.killTweensOf(wrapper);
      gsap.killTweensOf(panel);

      // Make visible and prepare to measure
      wrapper.style.display = "block";
      wrapper.style.overflow = "hidden";

      // Measure target height from inner container (clean 0-boundary, accurate layout height)
      const targetHeight = inner.offsetHeight;

      if (prefersReducedMotion) {
        gsap.set(wrapper, { height: "auto", overflow: "visible" });
        gsap.set(panel, { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        wrapper,
        { height: wrapper.offsetHeight },
        {
          height: targetHeight,
          duration: 0.42,
          ease: "power3.out",
          onComplete: () => {
            gsap.set(wrapper, { height: "auto", overflow: "visible" });
            if (typeof ScrollTrigger !== "undefined") {
              ScrollTrigger.refresh();
            }
            const refresh = (
              window as unknown as { __refreshScroll?: () => void }
            )?.__refreshScroll;
            if (refresh) refresh();
          },
        }
      );

      gsap.fromTo(
        panel,
        { opacity: 0, y: -10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.36,
          delay: 0.04,
          ease: "power2.out",
        }
      );
    } else {
      // 1. Rotate arrow back to 0deg with GSAP
      if (icon) {
        gsap.killTweensOf(icon);
        gsap.to(icon, {
          rotation: 0,
          duration: prefersReducedMotion ? 0 : 0.36,
          ease: "power3.inOut",
        });
      }

      if (wrapper.style.display === "none") return;

      if (prefersReducedMotion) {
        gsap.set(wrapper, { height: 0, display: "none" });
        gsap.set(panel, { opacity: 0, y: -8 });
        return;
      }

      gsap.killTweensOf(wrapper);
      gsap.killTweensOf(panel);

      const currentHeight = wrapper.offsetHeight;
      gsap.set(wrapper, { overflow: "hidden", height: currentHeight });

      gsap.to(wrapper, {
        height: 0,
        duration: 0.34,
        ease: "power3.inOut",
        onComplete: () => {
          gsap.set(wrapper, { display: "none" });
          if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.refresh();
          }
          const refresh = (
            window as unknown as { __refreshScroll?: () => void }
          )?.__refreshScroll;
          if (refresh) refresh();
        },
      });

      gsap.to(panel, {
        opacity: 0,
        y: -6,
        duration: 0.22,
        ease: "power2.in",
      });
    }
  }, [isOpen, item.answer]);

  return (
    <div className={styles.accordionItem} data-open={isOpen}>
      <h3 className={styles.accordionHeading}>
        <button
          type="button"
          id={buttonId}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
          className={styles.accordionTrigger}
        >
          <span className={styles.accordionQuestion}>{item.question}</span>
          <span ref={iconRef} className={styles.accordionIconWrapper}>
            <Image
              src={arrowIcon}
              alt=""
              width={15}
              height={15}
              className={styles.accordionIcon}
            />
          </span>
        </button>
      </h3>

      <div
        ref={wrapperRef}
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={styles.accordionPanelWrapper}
      >
        <div ref={innerRef} className={styles.accordionInner}>
          <div ref={panelRef} className={styles.accordionPanel}>
            <p className={styles.accordionAnswer}>{item.answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Accordion({ items, initialOpenId }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const accordionRef = useRef<HTMLDivElement>(null);

  const handleToggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !accordionRef.current) return;

    const itemEls = accordionRef.current.querySelectorAll(
      `.${styles.accordionItem}`
    );
    if (itemEls.length === 0) return;

    gsap.fromTo(
      itemEls,
      { opacity: 0, y: 14 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.07,
        ease: "power2.out",
        delay: 0.12,
        clearProps: "transform,opacity",
      }
    );
  }, []);

  return (
    <div ref={accordionRef} className={styles.accordion}>
      {items.map((item) => (
        <AccordionItemComponent
          key={item.id}
          item={item}
          isOpen={item.id === openId}
          onToggle={() => handleToggle(item.id)}
        />
      ))}
    </div>
  );
}
