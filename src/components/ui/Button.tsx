"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

type ButtonVariant = "lime" | "dark" | "ghost";
type ButtonSize = "md" | "lg";

type ButtonProps = {
  variant: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  children: ReactNode;
};

const variantClassNames: Record<ButtonVariant, string> = {
  lime: "bg-lime-bright text-ink-canvas hover:bg-lime-mid",
  dark: "bg-ink-canvas text-light-cream hover:bg-ink-strong",
  ghost: "bg-transparent text-ink-strong border border-neutral-300 hover:bg-light-gray",
};

const sizeClassNames: Record<ButtonSize, string> = {
  md: "px-5 py-2.5 text-sm",
  lg: "ds-button-lg",
};

// Only a real in-page anchor (e.g. "#pricing") renders an <a>. A bare "#"
// jumps the viewport to the top on activation, so it is treated as "no href".
function isInPageAnchor(href: string | undefined): href is string {
  return typeof href === "string" && href.length > 1 && href.startsWith("#");
}

export function Button({
  variant,
  size = "md",
  href,
  className,
  children,
}: ButtonProps) {
  const classes = [
    "ds-button",
    variantClassNames[variant],
    sizeClassNames[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (isInPageAnchor(href)) {
    return (
      <motion.a
        href={href}
        className={classes}
        whileHover={{ scale: 1.025 }}
        whileTap={{ scale: 0.975 }}
        transition={{ type: "spring", stiffness: 450, damping: 25 }}
      >
        {children}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      className={classes}
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.975 }}
      transition={{ type: "spring", stiffness: 450, damping: 25 }}
    >
      {children}
    </motion.button>
  );
}
