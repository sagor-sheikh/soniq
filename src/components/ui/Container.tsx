import type { ReactNode } from "react";

type ContainerProps = {
  className?: string;
  children: ReactNode;
};

export function Container({ className, children }: ContainerProps) {
  const classes = className ? `ds-container ${className}` : "ds-container";

  return <div className={classes}>{children}</div>;
}
