import Image from "next/image";
import portraitPhoto from "../../../public/assets/dd9bfb140bd0ea9275a4428e2624862dcf41b9e357367d759ff300f4a2f8e712.png";
import avatarPhoto from "../../../public/assets/1467365dbbf91787c76b95ad8088f1896163aa243f530da8463cceaf08349cca.jpg";
import starIcon from "../../../public/assets/255819e79ad0bcd91e8ba05ebd8cdbb55c71ad830a72c18d9a04106b1fb55125.svg";
import communityIcon from "../../../public/assets/100265fa9c53d094bdb9894f15ba188daeffdd8563aeca5b29490a471280d298.svg";
import quoteIcon from "../../../public/assets/a5a819e830a661d5d68403000432836cd39465cabd45f842d43cefd42882c712.svg";
import arrowPrevIcon from "../../../public/assets/f489b9c5c40b6ce0c4e0166740d24b5d4201f13d3dff424bf5cd6907c8f66a25.svg";
import arrowNextIcon from "../../../public/assets/10e0eff98e992ea9a804e1031b6021327d5d96e7c0bacf70b8b19b65977c4153.svg";
import styles from "./Habits.module.css";

const STAR_COUNT = 5;

export function Habits() {
  return (
    <section id="habits" data-section="habits" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.lead} data-reveal="lead">
            <div className={styles.headingBlock}>
              {/*
               * The mobile frame 2676:1010 (node 2676:1088) repeats the
               * transactions section's heading verbatim — a copy-paste
               * leftover, recorded for audit as
               * habits.copy.mobileHeadingRawAsExtracted in
               * design/sections.json. habits.copy.mobileHeadingOverride (the
               * desktop copy below) is the resolved string for BOTH widths.
               *
               * The comps break it after "Financial" with a hard <br>; here
               * the string stays whole and .heading's max-width does the
               * breaking, so the copy survives as one searchable run of text.
               */}
              <h2 className={styles.heading}>
                Build Better Financial Habits With Soniq
              </h2>
              <p className={styles.subhead}>
                Make informed decisions, reduce unnecessary spending, and stay
                focused on your financial goals.
              </p>
            </div>
            {/* 2655:984 — desktop only; absent from the mobile comp. */}
            <button type="button" className={styles.cta}>
              Start for Free
            </button>
          </div>

          {/* 2655:986 — desktop only; absent from the mobile comp. */}
          <div className={styles.rating} data-reveal data-reveal-delay="1">
            <div className={styles.ratingRow}>
              <p className={styles.ratingScore} data-countup>
                4.9/5
              </p>
              <div className={styles.stars}>
                {Array.from({ length: STAR_COUNT }, (_, index) => (
                  <Image
                    key={index}
                    src={starIcon}
                    alt=""
                    width={22}
                    height={22}
                    className={styles.star}
                  />
                ))}
              </div>
            </div>
            <p className={styles.ratingCaption}>
              Trusted by users who want a simpler and smarter way to manage
              money.
            </p>
          </div>
        </div>

        <div className={styles.right} data-reveal data-reveal-delay="2">
          <div className={styles.cardRow}>
            <figure className={styles.photoCard}>
              <Image
                src={portraitPhoto}
                alt="Portrait of Michael Chen, a Soniq user, smiling and giving a thumbs up"
                fill
                sizes="(min-width: 768px) 348px, 50vw"
                className={styles.portrait}
              />
              <div className={styles.photoFade} aria-hidden />
              <figcaption className={styles.photoCaption}>
                <span className={styles.personName}>Michael Chen</span>
                <span className={styles.personRole}>Australia</span>
              </figcaption>
            </figure>

            <div className={styles.statCard}>
              <div className={styles.statTop}>
                <Image
                  src={communityIcon}
                  alt=""
                  width={25}
                  height={25}
                  className={styles.statIcon}
                />
                <p className={styles.statBody}>
                  A community of 50K+ users managing their money smartly
                </p>
              </div>
              <p className={styles.statValue} data-countup>50k</p>
            </div>
          </div>

          <figure className={styles.quoteCard}>
            <div className={styles.quoteBody}>
              <Image
                src={quoteIcon}
                alt=""
                width={54}
                height={54}
                className={styles.quoteIcon}
              />
              <blockquote className={styles.quote}>
                <p>
                  &ldquo;Soniq gives me a complete view of my finances without
                  making things complicated. Tracking expenses and planning my
                  monthly budget now feels effortless.&rdquo;
                </p>
              </blockquote>
            </div>
            <figcaption className={styles.quoteAuthor}>
              <Image
                src={avatarPhoto}
                alt=""
                width={56}
                height={56}
                className={styles.avatar}
              />
              <span className={styles.personText}>
                <span className={styles.personName}>Michael Chen</span>
                <span className={styles.personRole}>Soniq Pro User</span>
              </span>
            </figcaption>
          </figure>
        </div>

        {/*
         * 2655:1032 / 2676:1133 — the same pair of carousel chevrons, drawn
         * inside the quote card's bottom row on desktop and below the cards on
         * mobile. There is one testimonial and nothing to page through, so
         * they are decorative rather than fake controls.
         */}
        <div className={styles.arrows} aria-hidden>
          <div className={`${styles.arrowButton} ${styles.arrowPrev}`}>
            <Image
              src={arrowPrevIcon}
              alt=""
              width={20}
              height={20}
              className={styles.arrowIcon}
            />
          </div>
          <div className={`${styles.arrowButton} ${styles.arrowNext}`}>
            <Image
              src={arrowNextIcon}
              alt=""
              width={20}
              height={20}
              className={styles.arrowIcon}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
