import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  block?: boolean;
};

export function Button({ block, className, children, ...rest }: Props) {
  const cn = [
    "button",
    !className?.includes("button-primary") &&
    !className?.includes("button-secondary") &&
    !className?.includes("button-ghost")
      ? "button-primary"
      : "",
    block ? "button-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={cn} {...rest}>
      {children}
    </button>
  );
}

