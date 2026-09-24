import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Accordion, type AccordionItemData } from "@/components/ui/Accordion";
import styles from "./Faq.module.css";

// Copy is verbatim from design/sections.json faq.copy. The heading is the
// desktop string at both widths: the mobile frame (2677:1312) carries a
// stale "See Every Transaction In One Place" that sections.json overrides
// via copy.mobileHeadingOverride.
// The comp breaks the heading after "About" (line 2 is 578px wide, so the
// break is deliberate rather than a width constraint). Mobile keeps the
// single flowing string -- .headingBreak is display:none below 768px.
const HEADING_LINE_1 = "Questions About ";
const HEADING_LINE_2 = "Managing Money With Soniq?";
const SUBHEAD =
  "Find answers about security, payments, budgeting, account setup, and Soniq's financial tools.";

// faqInitialOpen in design/sections.json: index 0 is the only item drawn
// expanded in either comp, so it is the accordion's initial open item.
const FAQ_ITEMS: AccordionItemData[] = [
  {
    id: "faq-0",
    question: "What can I manage with Soniq?",
    answer:
      "You can track income and expenses, manage budgets, monitor payments, review financial insights, and set personalized savings goals.",
  },
  {
    id: "faq-1",
    question: "Is my financial information secure?",
    answer:
      "Yes, Soniq uses bank-grade 256-bit encryption and strict biometric authentication to keep your accounts, payments, and personal data fully protected at all times.",
  },
  {
    id: "faq-2",
    question: "Can Soniq automatically categorize transactions?",
    answer:
      "Yes, our smart AI engine automatically sorts and tags every purchase into clear categories like Entertainment, Groceries, and Utilities in real time.",
  },
  {
    id: "faq-3",
    question: "Can I use Soniq without financial experience?",
    answer:
      "Absolutely. Soniq is designed for everyone with an intuitive dashboard, plain-English summaries, and automated budgeting tools that guide you step-by-step.",
  },
  {
    id: "faq-4",
    question: "Can I change or cancel my plan?",
    answer:
      "Yes, you can upgrade, downgrade, or cancel your plan at any time directly from your account settings with no hidden fees or cancellation penalties.",
  },
];

export function Faq() {
  return (
    <section id="faq" data-section="faq" className={styles.section}>
      <div className={styles.background} aria-hidden />

      <div className={styles.content}>
        <Container>
          <div className={styles.grid}>
            <div className={styles.intro} data-reveal="lead">
              <h2 className={`ds-h2 ${styles.heading}`}>
                {HEADING_LINE_1}
                <br className={styles.headingBreak} />
                {HEADING_LINE_2}
              </h2>
              <p className={styles.subhead}>{SUBHEAD}</p>
              <div className={styles.ctaRow}>
                <Button variant="dark" size="lg">
                  Contact Support
                </Button>
              </div>
            </div>

            <div className={styles.accordionColumn} data-reveal data-reveal-delay="1">
              <div className={styles.accordionCard}>
                <Accordion items={FAQ_ITEMS} initialOpenId={FAQ_ITEMS[0].id} />
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
