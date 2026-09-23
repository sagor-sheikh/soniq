import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SiteHeader } from "@/components/sections/hero/SiteHeader";
import {
  heroBackgroundPhoto,
  partnerLogos,
  trustedAvatars,
  ratingCardPhoto,
  eyebrowIcon,
  avatarPlusIcon,
  statIcon,
} from "@/lib/assets";
import styles from "./Hero.module.css";

// The intro paragraph's two runs share one font size and differ only by
// opacity (design/sections.json hero.mixedSizeSpans) — not a font-size
// split.
const FEATURE_INTRO_SPANS = [
  {
    text: "Track spending, manage cashflow, and achieve your financial goals with our intelligent tools. ",
    dim: false,
  },
  {
    text: "Everything you need to manage your finances confidently—all in one secure platform. ",
    dim: true,
  },
];

function StatIcon() {
  return (
    <Image
      src={statIcon.src}
      alt=""
      width={statIcon.width}
      height={statIcon.height}
      className={styles.statIcon}
    />
  );
}

function DarkStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={`${styles.statCard} ${styles.statCardDark}`}>
      <div className={styles.statCardLabelRow}>
        <StatIcon />
        <p className={styles.statLabel}>{label}</p>
      </div>
      <p className={styles.statValue} data-countup>{value}</p>
    </div>
  );
}

export function Hero() {
  return (
    <section id="hero" data-section="hero" className={styles.section}>
      <div className={styles.backgroundLayer} aria-hidden>
        {/* 2655:709 / 2672:687 -- the fill is scaleMode CROP, so the image is
            larger than its box and offset inside it. `fill` cannot be used:
            it writes inline inset/size styles a class cannot override. */}
        <Image
          src={heroBackgroundPhoto.src}
          alt=""
          width={1875}
          height={1250}
          priority
          sizes="100vw"
          className={styles.backgroundImage} data-parallax="-60"
        />
        {/* Ambient loop generated from this very still (Higgsfield/Grok
            image-to-video), so its first frame is the comp image. It stays
            transparent until MotionRoot assigns a src, which it never does
            for a reduced-motion reader -- they keep the still above. */}
        <video
          className={styles.backgroundImage}
          data-parallax="-60"
          data-bg-video
          data-src="/video/hero-loop.mp4"
          muted
          loop
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className={styles.backgroundGlow} />
      </div>

      <div className={styles.content}>
        <SiteHeader />

        <div className={styles.hero}>
          <Container>
            <div className={styles.headlineBlock} data-reveal="lead">
              <div className={styles.headlineText}>
                <h1 className={styles.headline}>
                  Get Your Financial Future Under Control
                </h1>
                <p className={styles.subhead}>
                  Track spending, manage payments, and grow your money with
                  intelligent financial tools built for everyday life.
                </p>
              </div>
              <div className={styles.ctaRow}>
                <Button variant="lime" size="lg">
                  Get Started
                </Button>
                <a href="#features" className={styles.secondaryCta}>
                  Explore Features
                </a>
              </div>
            </div>
          </Container>

          <Container>
            <div className={styles.panel}>
              <div className={styles.eyebrowRow} data-reveal data-reveal-delay="1">
                <div className={styles.eyebrowLeft}>
                  <Image
                    src={eyebrowIcon.src}
                    alt=""
                    width={eyebrowIcon.width}
                    height={eyebrowIcon.height}
                    className={styles.eyebrowIcon}
                  />
                  <span className={styles.eyebrowLabel}>About Soniq</span>
                </div>
                <div className={styles.eyebrowRight}>
                  <p className={styles.eyebrowTag}>
                    Simple. Secure. Intelligent.
                  </p>
                  <p className={styles.eyebrowBody}>
                    Helping individuals and businesses make smarter financial
                    decisions with real-time insights.
                  </p>
                </div>
              </div>

              <div className={styles.logosRow} data-reveal data-reveal-delay="2">
                {partnerLogos.map((logo) => (
                  <div key={logo.name} className={styles.logoCell}>
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      width={logo.width}
                      height={logo.height}
                    />
                  </div>
                ))}
                <div
                  className={styles.logosFade}
                  aria-hidden
                  style={{ backgroundImage: "var(--gradient-hero-partner-fade)" }}
                />
              </div>

              <div>
                <p className={styles.featureIntro} data-reveal data-reveal-delay="2">
                  {FEATURE_INTRO_SPANS.map((span) => (
                    <span
                      key={span.text}
                      className={span.dim ? styles.featureIntroDim : undefined}
                    >
                      {span.text}
                    </span>
                  ))}
                </p>

                <div className={styles.statCardsRow} data-reveal data-reveal-delay="3">
                  <div className={`${styles.statCard} ${styles.statCardTrusted}`}>
                    <div className={styles.avatarStack}>
                      {trustedAvatars.map((avatar, index) => (
                        <Image
                          key={index}
                          src={avatar.src}
                          alt={avatar.alt}
                          width={avatar.width}
                          height={avatar.height}
                        />
                      ))}
                      <div className={styles.avatarPlus}>
                        <Image
                          src={avatarPlusIcon.src}
                          alt={avatarPlusIcon.alt}
                          width={avatarPlusIcon.width}
                          height={avatarPlusIcon.height}
                        />
                      </div>
                    </div>
                    <div className={styles.trustedText}>
                      <p className={styles.trustedHeading}>Trusted Worldwide</p>
                      <p className={styles.trustedBody}>
                        Helping thousands of users manage their money with
                        confidence.
                      </p>
                    </div>
                  </div>

                  <DarkStatCard label="Active User" value="50M+" />

                  <div className={`${styles.statCard} ${styles.statCardPhoto}`}>
                    <Image
                      src={ratingCardPhoto.src}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 300px, 50vw"
                      className={styles.statCardPhotoImage}
                    />
                    <div className={styles.statCardLabelRow}>
                      <StatIcon />
                      <p className={styles.statLabel}>Average Rating</p>
                    </div>
                    <p className={styles.statValue} data-countup>4.9</p>
                  </div>

                  <DarkStatCard label="Countries Served" value="120+" />
                </div>
              </div>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
