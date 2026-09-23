import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { TransactionList } from "@/components/sections/transactions/TransactionList";
import { BalanceCard } from "@/components/sections/transactions/BalanceCard";
import styles from "./Transactions.module.css";

// Desktop node 2665:459 / mobile node 2676:988. The two big blurred ellipses
// and the card photo are the mockup card's own decorative fills; the tick
// mark repeats four times.
import mockupPhotoSrc from "../../../public/assets/e0d9e8d0763bdf36fde91f343e135d3474073b5ece6ffa02369f4d149d7f1257.png";
import mockupEllipseTopSrc from "../../../public/assets/bffa6c86dbaa41fd0adde85545064171e321c0b20139e9a2736dce25de12da2d.svg";
import mockupEllipseBottomSrc from "../../../public/assets/40b990677a6adf06cd78d0314f579974c8f98dd7fe613bd69c528948acb3c241.svg";
import tickIconSrc from "../../../public/assets/aed38f19aad617717cd9af46d9121b30102cd670d6a4b372509bf6d39633c216.svg";

const FEATURE_TICKS = [
  "AI Spending Insights",
  "Smart Transaction Categories",
  "Secure Payment Records",
  "Smart Receipt Scanner",
];

// The mockup is crisp HTML, but it is fake product data: every string inside
// it is hidden from assistive technology and the whole block is announced
// once, as a single image, through this label.
const MOCKUP_LABEL =
  "Mockup of the Soniq app: a transaction history list showing five recent payments, an available-balance card reading $1,234.00 with transfer and withdraw controls, and a payment-plan picker offering the Essential Plan at $58.00 and Soniq Pro at $88.00.";

export function Transactions() {
  return (
    <section
      id="transactions"
      data-section="transactions"
      className={styles.section}
    >
      <Container>
        <div className={styles.inner}>
          <div className={styles.header} data-reveal="lead">
            <h2 className={styles.heading}>
              See Every Transaction
              <br />
              {" In One Place"}
            </h2>
            <p className={styles.headerSubhead}>
              Stay informed with real-time transaction updates and organized
              financial records.
            </p>
          </div>

          <div className={styles.mockup} data-reveal data-reveal-delay="1" role="img" aria-label={MOCKUP_LABEL}>
            <div className={styles.mockupCard} aria-hidden="true">
              <div className={styles.mockupDecor}>
                <Image
                  src={mockupPhotoSrc}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 92vw, 100vw"
                  className={styles.mockupPhoto}
                />
                {/* Ambient loop generated from this very still (Higgsfield/Grok
                    image-to-video), so its first frame is the comp image. It stays
                    transparent until MotionRoot assigns a src, which it never does
                    for a reduced-motion reader -- they keep the still above. */}
                <video
                  className={styles.mockupPhotoVideo}
                  data-bg-video
                  data-src="/video/tx-loop.mp4"
                  muted
                  loop
                  playsInline
                  preload="none"
                  aria-hidden="true"
                  tabIndex={-1}
                />
                <Image
                  src={mockupEllipseTopSrc}
                  alt=""
                  width={2523}
                  height={1188}
                  className={styles.mockupEllipseTop}
                />
                <Image
                  src={mockupEllipseBottomSrc}
                  alt=""
                  width={2705}
                  height={1228}
                  className={styles.mockupEllipseBottom}
                />
              </div>

              <div className={styles.mockupBody}>
                <div className={styles.mockupPrimary}>
                  <TransactionList />

                  <div className={styles.mockupIntro}>
                    <div className={styles.mockupIntroText}>
                      <p className={styles.mockupHeading}>
                        Track every transaction
                        <br />
                        with confidence
                      </p>
                      <p className={styles.mockupBlurb}>
                        Secure payments, AI-powered expense tracking, and
                        instant financial insights—all in one place.
                      </p>
                    </div>
                    <span className={styles.mockupCta}>Get Started</span>
                  </div>
                </div>

                <ul className={styles.tickList}>
                  {FEATURE_TICKS.map((tick) => (
                    <li key={tick} className={styles.tickItem}>
                      <Image
                        src={tickIconSrc}
                        alt=""
                        width={16}
                        height={16}
                        className={styles.tickIcon}
                      />
                      <span className={styles.tickLabel}>{tick}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <span className={`${styles.badge} ${styles.badgeExpense}`}>
                Expense Tracking
              </span>
              <span className={`${styles.badge} ${styles.badgeIncome}`}>
                Instant Income
              </span>
            </div>

            <BalanceCard />
          </div>
        </div>
      </Container>
    </section>
  );
}
