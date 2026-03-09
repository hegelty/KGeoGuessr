import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Props = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    block?: boolean;
  }
>;

export function Button({
  children,
  className = "",
  variant = "primary",
  block = false,
  ...props
}: Props) {
  return (
    <button
      className={`button button-${variant} ${block ? "button-block" : ""} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

