"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import portraitPhoto from "../../../public/assets/dd9bfb140bd0ea9275a4428e2624862dcf41b9e357367d759ff300f4a2f8e712.png";
import avatarPhoto from "../../../public/assets/1467365dbbf91787c76b95ad8088f1896163aa243f530da8463cceaf08349cca.jpg";
import starIcon from "../../../public/assets/255819e79ad0bcd91e8ba05ebd8cdbb55c71ad830a72c18d9a04106b1fb55125.svg";
import communityIcon from "../../../public/assets/100265fa9c53d094bdb9894f15ba188daeffdd8563aeca5b29490a471280d298.svg";
import quoteIcon from "../../../public/assets/a5a819e830a661d5d68403000432836cd39465cabd45f842d43cefd42882c712.svg";
import arrowPrevIcon from "../../../public/assets/f489b9c5c40b6ce0c4e0166740d24b5d4201f13d3dff424bf5cd6907c8f66a25.svg";
import arrowNextIcon from "../../../public/assets/10e0eff98e992ea9a804e1031b6021327d5d96e7c0bacf70b8b19b65977c4153.svg";
import portraitElena from "../../../public/assets/b85f579ecd750a673bb68639f5fd95af5348dac3818e67b01fef5b0fc0acef64.jpg";
import avatarElena from "../../../public/assets/avatar_elena.jpg";
import portraitDavid from "../../../public/assets/portrait_david.jpg";
import avatarDavid from "../../../public/assets/avatar_david.jpg";
import styles from "./Habits.module.css";

const STAR_COUNT = 5;

interface TestimonialSlide {
  id: string;
  name: string;
  location: string;
  role: string;
  portrait: typeof portraitPhoto;
  portraitAlt: string;
  avatar: typeof avatarPhoto;
  avatarAlt: string;
  quote: string;
  statBody: string;
  statValue: string;
  portraitPosition?: string;
}

const TESTIMONIAL_SLIDES: TestimonialSlide[] = [
  {
    id: "michael-chen",
    name: "Michael Chen",
    location: "Australia",
    role: "Soniq Pro User",
    portrait: portraitPhoto,
    portraitAlt: "Portrait of Michael Chen, a Soniq user, smiling and giving a thumbs up",
    avatar: avatarPhoto,
    avatarAlt: "Portrait of Michael Chen, a Soniq Pro user",
    quote:
      "Soniq gives me a complete view of my finances without making things complicated. Tracking expenses and planning my monthly budget now feels effortless.",
    statBody: "A community of 50K+ users managing their money smartly",
    statValue: "50k",
    portraitPosition: "50% 31%",
  },
  {
    id: "elena-rostova",
    name: "Elena Rostova",
    location: "United Kingdom",
    role: "Verified Member",
    portrait: portraitElena,
    portraitAlt: "Portrait of Elena Rostova, a Soniq user reviewing her investments in the city",
    avatar: avatarElena,
    avatarAlt: "Portrait of Elena Rostova, a Soniq user",
    quote:
      "The automated categorizations and real-time cash flow alerts saved me hundreds in hidden charges. Planning our monthly savings is finally stress-free.",
    statBody: "Average annual savings achieved across active users",
    statValue: "$450",
    portraitPosition: "50% 28%",
  },
  {
    id: "david-ramirez",
    name: "David Ramirez",
    location: "United States",
    role: "Wealth Builder",
    portrait: portraitDavid,
    portraitAlt: "Portrait of David Ramirez, a Soniq user standing on a rooftop terrace",
    avatar: avatarDavid,
    avatarAlt: "Portrait of David Ramirez, a Soniq user",
    quote:
      "Switching to Soniq transformed how I oversee my portfolio and daily cash habits. The clean interface and instant insights make it an indispensable daily habit.",
    statBody: "Over $12M+ in transactions tracked and optimized seamlessly",
    statValue: "$12M",
    portraitPosition: "50% 20%",
  },
];

export function Habits() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHoveredRef = useRef(false);

  const totalSlides = TESTIMONIAL_SLIDES.length;
  const currentSlide = TESTIMONIAL_SLIDES[currentIndex];

  const goToSlide = useCallback(
    (newIndex: number, dir: "next" | "prev" = "next") => {
      if (isAnimating) return;
      setIsAnimating(true);
      setDirection(dir);
      setCurrentIndex(newIndex);

      setTimeout(() => {
        setIsAnimating(false);
      }, 400);
    },
    [isAnimating],
  );

  const handlePrev = useCallback(() => {
    const nextIndex = (currentIndex - 1 + totalSlides) % totalSlides;
    goToSlide(nextIndex, "prev");
  }, [currentIndex, totalSlides, goToSlide]);

  const handleNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % totalSlides;
    goToSlide(nextIndex, "next");
  }, [currentIndex, totalSlides, goToSlide]);

  // Auto-advance carousel every 6.5 seconds when not hovered
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHoveredRef.current) {
        const nextIndex = (currentIndex + 1) % totalSlides;
        goToSlide(nextIndex, "next");
      }
    }, 6500);

    return () => clearInterval(timer);
  }, [currentIndex, totalSlides, goToSlide]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Only swipe if horizontal move is greater than vertical move
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Keyboard navigation support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      handlePrev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <section
      id="habits"
      data-section="habits"
      className={styles.section}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Habits and Testimonials Section"
    >
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.lead} data-reveal="lead">
            <div className={styles.headingBlock}>
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

        <div
          className={styles.right}
          data-reveal
          data-reveal-delay="2"
          data-direction={direction}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => {
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
          }}
          role="region"
          aria-roledescription="carousel"
          aria-label="User Reviews"
        >
          <div className={styles.cardRow}>
            <figure className={styles.photoCard}>
              <div
                key={`portrait-${currentSlide.id}`}
                className={`${styles.photoWrapper} ${isAnimating ? styles.slideFadeIn : ""}`}
              >
                <Image
                  src={currentSlide.portrait}
                  alt={currentSlide.portraitAlt}
                  fill
                  sizes="(min-width: 768px) 348px, 50vw"
                  className={styles.portrait}
                  style={
                    currentSlide.portraitPosition
                      ? { objectPosition: currentSlide.portraitPosition }
                      : undefined
                  }
                />
              </div>
              <div className={styles.photoFade} aria-hidden />
              <figcaption
                key={`caption-${currentSlide.id}`}
                className={`${styles.photoCaption} ${isAnimating ? styles.textFadeIn : ""}`}
              >
                <span className={styles.personName}>{currentSlide.name}</span>
                <span className={styles.personRole}>{currentSlide.location}</span>
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
                <p
                  key={`stat-body-${currentSlide.id}`}
                  className={`${styles.statBody} ${isAnimating ? styles.textFadeIn : ""}`}
                >
                  {currentSlide.statBody}
                </p>
              </div>
              <p
                key={`stat-val-${currentSlide.id}`}
                className={`${styles.statValue} ${isAnimating ? styles.textFadeIn : ""}`}
              >
                {currentSlide.statValue}
              </p>
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
              <blockquote
                key={`quote-${currentSlide.id}`}
                className={`${styles.quote} ${isAnimating ? styles.quoteFadeIn : ""}`}
                aria-live="polite"
              >
                <p>&ldquo;{currentSlide.quote}&rdquo;</p>
              </blockquote>
            </div>
            <figcaption
              key={`author-${currentSlide.id}`}
              className={`${styles.quoteAuthor} ${isAnimating ? styles.textFadeIn : ""}`}
            >
              <Image
                src={currentSlide.avatar}
                alt={currentSlide.avatarAlt}
                width={56}
                height={56}
                className={styles.avatar}
              />
              <span className={styles.personText}>
                <span className={styles.personName}>{currentSlide.name}</span>
                <span className={styles.personRole}>{currentSlide.role}</span>
              </span>
            </figcaption>
          </figure>
        </div>

        {/* Carousel control buttons */}
        <div className={styles.arrows} aria-label="Carousel navigation">
          <button
            type="button"
            onClick={handlePrev}
            className={`${styles.arrowButton} ${styles.arrowPrev} ${currentIndex === 0 ? styles.arrowBoundary : styles.arrowActive}`}
            aria-label={`Previous slide, currently on slide ${currentIndex + 1} of ${totalSlides}`}
          >
            <Image
              src={arrowPrevIcon}
              alt=""
              width={20}
              height={20}
              className={styles.arrowIcon}
            />
          </button>

          <div
            className={styles.dots}
            role="tablist"
            aria-label="Testimonial slides"
          >
            {TESTIMONIAL_SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={currentIndex === idx}
                aria-label={`Go to testimonial ${idx + 1} of ${totalSlides}: ${slide.name}`}
                onClick={() => goToSlide(idx, idx > currentIndex ? "next" : "prev")}
                className={`${styles.dot} ${currentIndex === idx ? styles.dotActive : ""}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className={`${styles.arrowButton} ${styles.arrowNext} ${currentIndex === totalSlides - 1 ? styles.arrowBoundary : styles.arrowActive}`}
            aria-label={`Next slide, currently on slide ${currentIndex + 1} of ${totalSlides}`}
          >
            <Image
              src={arrowNextIcon}
              alt=""
              width={20}
              height={20}
              className={styles.arrowIcon}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
