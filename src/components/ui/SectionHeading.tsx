type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  as?: "h1" | "h2";
  tone: "light" | "dark";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  as = "h2",
  tone,
  className,
}: SectionHeadingProps) {
  const Heading = as;
  const headingBaseClassName = as === "h1" ? "ds-h1" : "ds-h2";
  const headingToneClassName =
    tone === "dark" ? "text-light-cream" : "text-ink-strong";
  const eyebrowToneClassName =
    tone === "dark" ? "text-neutral-200" : "text-neutral-600";

  return (
    <div className={className}>
      {eyebrow ? (
        <p className={`ds-eyebrow ${eyebrowToneClassName}`}>{eyebrow}</p>
      ) : null}
      <Heading className={`${headingBaseClassName} ${headingToneClassName}`}>
        {title}
      </Heading>
    </div>
  );
}
