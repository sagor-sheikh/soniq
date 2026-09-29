import Image from "next/image";
import featuresPhoto from "../../../public/assets/a0648c705118e8c7ae2424d92dc183ecca29da83f9aa91e78e09a9e1d99f85b6.png";
import glowOliveDesktop from "../../../public/assets/6af6bb2f3b27112369a633af1ab0426f7e6255a613cf7df9918737c8fbee0e9d.svg";
import glowDarkDesktop1 from "../../../public/assets/3cde5777aaf5315331911ebbeb14252fe959a18bb27ee694aed0d3e029cdff7c.svg";
import glowDarkDesktop2 from "../../../public/assets/9b4ddc70cac886460c091fbfc143bbdad7ca4efb6216a2fc82e4f29a71087c96.svg";
import glowMobile from "../../../public/assets/6745b4eb726c4d978e144a9b13ac2cf8e614db6ca0b2e769ed709bdec238ef6b.svg";
import styles from "./Features.module.css";

// design/raw/2655-959.md nodes 2655:965 / :968 / :971 and
// design/raw/2676-1004.md nodes 2676:993 / :996 / :999 both carry THREE
// columns, and design/sections.json features.copy.columns lists three.
const FEATURE_COLUMNS = [
  {
    title: "Real-Time Insights",
    body: "Understand your financial activity with clear and continuously updated data.",
  },
  {
    title: "Secure Payments",
    body: "Send and receive money confidently with advanced account protection.",
  },
  {
    title: "Smarter Budgeting",
    body: "Create personalized budgets and stay on track with automatic alerts.",
  },
];

export function Features() {
  return (
    <section id="features" data-section="features" className={styles.section}>
      <div className={styles.content}>
        <h2 className={styles.heading} data-reveal="lead">
          Everything You Need
          <br />
          To Manage Money Better
        </h2>
        <ul className={styles.columns}>
          {FEATURE_COLUMNS.map((column, index) => (
            <li
              key={column.title}
              className={styles.column}
              data-reveal
              data-reveal-delay={index + 1}
            >
              <h3 className={styles.columnTitle}>{column.title}</h3>
              <p className={styles.columnBody}>{column.body}</p>
            </li>
          ))}
        </ul>
      </div>

      {/*
       * One raster for both breakpoints. public/assets/manifest.json records
       * nodeIds ["2655:961","2676:1002"] against a single entry
       * (sha256 a0648c70…, 1535x1024), so the desktop and mobile fills are
       * byte-identical — a hidden/md:block <Image> pair would fetch the same
       * bytes twice for nothing.
       */}
      <div className={styles.photo} data-reveal data-reveal-delay="2">
        <Image
          src={featuresPhoto}
          alt="A smiling Soniq customer holding up a lime-green Soniq card and a black partner card."
          fill
          sizes="(min-width: 768px) 128vw, 100vw"
          className={styles.photoImage}
        />
      </div>

      {/* Nodes 2655:975/976/977 (desktop) and 2676:1005 (mobile):
          blurred vector ellipses that fade the lower half of the section to
          #141507 and cast the soft olive atmospheric glow on the left, matching
          the exact design specification. */}
      <div className={styles.glow} aria-hidden="true">
        <div className={styles.glowDesktop}>
          <Image
            src={glowOliveDesktop}
            alt=""
            width={2140}
            height={1565}
            className={styles.glowOlive}
          />
          <Image
            src={glowDarkDesktop1}
            alt=""
            width={2847}
            height={2556}
            className={styles.glowDark1}
          />
          <Image
            src={glowDarkDesktop2}
            alt=""
            width={3093}
            height={1223}
            className={styles.glowDark2}
          />
        </div>
        <div className={styles.glowMobileWrapper}>
          <Image
            src={glowMobile}
            alt=""
            width={1835}
            height={1201}
            className={styles.glowMobile}
          />
        </div>
      </div>

      <div className={styles.bottomGradient} aria-hidden="true" />
    </section>
  );
}
