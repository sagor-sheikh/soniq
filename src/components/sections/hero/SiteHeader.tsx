import Image from "next/image";
import { navLogoMark } from "@/lib/assets";
import { MobileNav } from "./MobileNav";
import styles from "../Hero.module.css";

const NAV_LINKS = [
  { label: "Home", href: "#hero" },
  { label: "Solutions", href: "#transactions" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
];

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <nav aria-label="Primary" className={styles.navPill}>
        <div className={styles.navBrand}>
          <Image
            src={navLogoMark.src}
            alt={navLogoMark.alt}
            width={navLogoMark.width}
            height={navLogoMark.height}
            className={styles.navLogoMark}
          />
          <span className={styles.navWordmark}>Soniq</span>
        </div>

        <ul className={`${styles.navLinks} hidden md:flex`}>
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className={styles.navLink}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <a href="#pricing" className={`${styles.navCta} hidden md:inline-flex`}>
          Get Started
        </a>

        <MobileNav links={NAV_LINKS} />
      </nav>
    </header>
  );
}
