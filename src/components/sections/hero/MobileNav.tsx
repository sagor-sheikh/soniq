"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import styles from "../Hero.module.css";

type NavLink = {
  label: string;
  href: string;
};

type MobileNavProps = {
  links: NavLink[];
};

export function MobileNav({ links }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={() => setIsOpen((open) => !open)}
        className={styles.navToggle}
      >
        <span className={styles.navToggleBar} aria-hidden />
        <span className={styles.navToggleBar} aria-hidden />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            id="mobile-menu"
            className={styles.mobileMenu}
            data-open="true"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={styles.mobileMenuLink}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
