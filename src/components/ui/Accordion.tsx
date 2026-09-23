"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import arrowIcon from "../../../public/assets/55b3371cda2543530751d1c3f8a1b5550d0ef7cec37de699eea89d40af8efdaa.svg";
// The accordion is only used by the FAQ section and is styled entirely from
// that section's module, the same way hero/MobileNav.tsx reads Hero.module.css.
import styles from "@/components/sections/Faq.module.css";

export type AccordionItemData = {
  id: string;
  question: string;
  // The Figma comp only draws the answer for the item that is expanded
  // (design/sections.json faq.copy.items) — the other four record
  // `answer: null` and render an empty panel rather than invented copy.
  answer: string | null;
};

type AccordionProps = {
  items: AccordionItemData[];
  initialOpenId: string;
};

export function Accordion({ items, initialOpenId }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(initialOpenId);

  const handleToggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className={styles.accordion}>
      {items.map((item) => {
        const isOpen = item.id === openId;
        const buttonId = `${item.id}-btn`;
        const panelId = `${item.id}-panel`;

        return (
          <div key={item.id} className={styles.accordionItem}>
            <h3 className={styles.accordionHeading}>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => handleToggle(item.id)}
                className={styles.accordionTrigger}
              >
                <span className={styles.accordionQuestion}>
                  {item.question}
                </span>
                <Image
                  src={arrowIcon}
                  alt=""
                  width={16}
                  height={16}
                  data-open={isOpen}
                  className={styles.accordionIcon}
                />
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {isOpen && item.answer ? (
                <motion.div
                  key="panel"
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{
                    height: "auto",
                    opacity: 1,
                    transition: {
                      height: {
                        duration: 0.38,
                        ease: [0.16, 1, 0.3, 1],
                      },
                      opacity: {
                        duration: 0.28,
                        delay: 0.05,
                        ease: "easeOut",
                      },
                    },
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                    transition: {
                      height: {
                        duration: 0.28,
                        ease: [0.16, 1, 0.3, 1],
                      },
                      opacity: {
                        duration: 0.18,
                        ease: "easeIn",
                      },
                    },
                  }}
                  style={{ overflow: "hidden" }}
                  onAnimationComplete={() => {
                    const refresh = (
                      window as unknown as { __refreshScroll?: () => void }
                    )?.__refreshScroll;
                    if (refresh) refresh();
                  }}
                >
                  <div className={styles.accordionPanel}>
                    <p className={styles.accordionAnswer}>{item.answer}</p>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
