import Image from "next/image";
import featuresPhoto from "../../../public/assets/a0648c705118e8c7ae2424d92dc183ecca29da83f9aa91e78e09a9e1d99f85b6.png";
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

      {/* Nodes 2655:975/976/977 (desktop) and 2676:1006/1007 (mobile): large
          blurred ellipses that fade the lower half of the section to
          #141507. Omitted in the first pass, which left the section flat
          cream to its bottom edge and exposed photo detail the comp crushes
          to black. Reproduced as radial gradients rather than multi-megabyte
          blurred SVGs -- a Figma LAYER_BLUR of radius b feathers an edge over
          about +/-b, so each gradient is sized (r + b) with its solid stop at
          (r - b) / (r + b). */}
      <div className={styles.glow} aria-hidden />
    </section>
  );
}
