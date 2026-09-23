import Image from "next/image";
import { Container } from "@/components/ui/Container";
import styles from "./Footer.module.css";
// design/sections.json footer.assets — the 48px desktop logo mark is the one
// rendered at both widths (CSS scales it to 36px on mobile) rather than
// shipping the 36px export as a second, display:none instance.
import logoMark from "../../../public/assets/3d6fcf85dfc89b6d239b11d864e9f4f8031fa4047deae85f5c16ea5215f8b046.svg";
import linkedInIcon from "../../../public/assets/502994da442dd6ac1a779f416ab41ddcda51304bff316558baeb146ca3f6571e.svg";
import instagramIcon from "../../../public/assets/4bab79fcd7601dd2d9d306c705b855631fb3ef752c5e205629e09e4fd11e17f5.svg";
import facebookIcon from "../../../public/assets/0a34a5d78adfe2c2239cfa19fbb4df65baa8f3b2c2e8a16e5fd0f72364bda0a9.svg";

const DESCRIPTION =
  "Soniq helps you track spending, manage payments, build better budgets, and make confident financial decisions.";

// The comp records no destinations for these. An href pointing back at this
// same section is still a no-op that pushes history and moves focus, so they
// render as presentational buttons like every other destination-less control
// on the page -- only links with a real in-page target stay anchors.
const SOCIAL_LINKS = [
  { name: "LinkedIn", icon: linkedInIcon },
  { name: "Instagram", icon: instagramIcon },
  { name: "Facebook", icon: facebookIcon },
];

const NAV_COLUMNS = [
  {
    heading: "Pages",
    links: [
      { label: "Home", href: "#hero" },
      { label: "Solutions", href: "#transactions" },
      { label: "Resources", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Help Center", href: "#faq" },
      { label: "Security", href: "#faq" },
      { label: "Financial Guides", href: "#features" },
      { label: "Contact Support", href: "#faq" },
    ],
  },
  {
    heading: "Contact Info",
    links: [
      { label: "+1 00 000 0000", href: "tel:+10000000000" },
      { label: "support@soniq.com", href: "mailto:support@soniq.com" },
    ],
  },
];

const LEGAL_LINKS = ["Privacy Policy", "Team of Services", "Licences"];

export function Footer() {
  return (
    <footer id="footer" data-section="footer" className={styles.footer}>
      {/* Oversized decorative wordmark (2655:1161 / 2677:1319). The brand
          name is already announced by the header and the logo row below. */}
      <p className={styles.wordmark} aria-hidden="true" data-decorative="wordmark">
        Soniq
      </p>

      <div className={styles.content}>
        <Container>
          <h2 className="sr-only">Footer</h2>

          <div className={styles.top} data-reveal="lead">
            <div className={styles.brand}>
              <div className={styles.brandRow}>
                <Image
                  src={logoMark}
                  alt=""
                  width={48}
                  height={48}
                  className={styles.logoMark}
                />
                <span className={styles.logoWord}>Soniq</span>
              </div>

              <div className={styles.brandBody}>
                <p className={styles.description}>{DESCRIPTION}</p>
                <ul className={styles.socialList}>
                  {SOCIAL_LINKS.map((social) => (
                    <li key={social.name}>
                      <button type="button" className={styles.socialLink}>
                        <Image
                          src={social.icon}
                          alt=""
                          width={24}
                          height={24}
                        />
                        <span className="sr-only">{social.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <nav aria-label="Footer" className={styles.nav}>
              {NAV_COLUMNS.map((column) => (
                <div key={column.heading} className={styles.navColumn}>
                  <h3 className={styles.navHeading}>{column.heading}</h3>
                  <ul className={styles.navLinks}>
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <a href={link.href} className={styles.navLink}>
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className={styles.legal} data-reveal data-reveal-delay="1">
            <p className={styles.address}>1212 Broadway Oakland, CA 94612</p>
            <ul className={styles.legalLinks}>
              {LEGAL_LINKS.map((label) => (
                <li key={label}>
                  <button type="button" className={styles.navLink}>
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>
    </footer>
  );
}
