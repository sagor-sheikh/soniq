import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import checkMarkSrc from "../../../public/assets/aed38f19aad617717cd9af46d9121b30102cd670d6a4b372509bf6d39633c216.svg";
import styles from "./Pricing.module.css";

type Plan = {
  name: string;
  price: string;
  period: string;
  blurb: string;
  features: string[];
  cta: string;
  // Card surface: the first plan sits on the lime fill, the second on cream.
  surface: "lime" | "cream";
};

const PLANS: Plan[] = [
  {
    name: "Soniq Essential",
    price: "$0",
    period: "/month",
    blurb: "For simple everyday money management.",
    features: [
      "Track income and expenses",
      "Automatic spending categories",
      "Monthly budget creation",
      "Secure transaction history",
      "Basic financial insights",
    ],
    cta: "Get Started",
    surface: "lime",
  },
  {
    name: "Soniq Pro",
    price: "$12",
    period: "/month",
    blurb: "For advanced control and smarter financial planning.",
    features: [
      "Everything in Essential",
      "Advanced spending analytics",
      "Custom financial goals",
      "Smart budget recommendations",
      "Automated financial reports",
    ],
    cta: "Get Started",
    surface: "cream",
  },
];

export function Pricing() {
  return (
    <section id="pricing" data-section="pricing" className={styles.section}>
      <Container className={styles.stack}>
        <div className={styles.headingBlock} data-reveal="lead">
          <SectionHeading
            title="Match Your Goals to Your Plan"
            as="h2"
            tone="dark"
            className={styles.heading}
          />
          <p className={styles.subhead}>
            Start with the essentials or upgrade for deeper insights,
            automation, and advanced financial controls.
          </p>
        </div>

        <ul className={styles.plans}>
          {PLANS.map((plan, index) => (
            <li
              key={plan.name}
              className={styles.planItem}
              data-reveal
              data-reveal-delay={index + 1}
            >
              <article
                className={`${styles.card} ${
                  plan.surface === "lime" ? styles.cardLime : styles.cardCream
                }`}
              >
                <div className={styles.cardHeader}>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <p className={styles.planBlurb}>{plan.blurb}</p>
                </div>

                <p className={styles.priceRow}>
                  <span className={styles.price}>{plan.price}</span>
                  <span className={styles.period}>{plan.period}</span>
                </p>

                {/* Presentational CTA: no destination exists yet, so this is a
                    button rather than an anchor. */}
                <button
                  type="button"
                  className={`${styles.cta} ${
                    plan.surface === "lime" ? styles.ctaDark : styles.ctaLight
                  }`}
                >
                  {plan.cta}
                </button>

                <div className={styles.features}>
                  <p className={styles.featuresLabel}>What&apos;s included:</p>
                  <ul className={styles.featureList}>
                    {plan.features.map((feature) => (
                      <li key={feature} className={styles.feature}>
                        {/* eager: next/image lazy-loads by default, and an
                            image that never enters the viewport leaves
                            img.decode() pending forever — which is exactly
                            what scripts/measure.mjs awaits. */}
                        <Image
                          src={checkMarkSrc}
                          alt=""
                          width={16}
                          height={16}
                          loading="eager"
                          className={styles.check}
                        />
                        <span className={styles.featureText}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
