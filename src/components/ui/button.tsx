import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "dark" | "secondary" | "ghost" | "light";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-[background-color,color,box-shadow,transform,border-color] duration-200 ease-[var(--ease-out-quint)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white shadow-[0_1px_0_rgb(255_255_255/0.15)_inset,0_6px_16px_-6px_rgb(200_16_46/0.6)] hover:bg-accent-strong",
  dark: "bg-ink text-white hover:bg-ink-2 shadow-[0_6px_16px_-8px_rgb(12_14_18/0.6)]",
  secondary: "bg-surface text-ink border border-line-strong hover:border-ink/40 hover:bg-white shadow-xs",
  ghost: "text-ink hover:bg-ink/5",
  light: "bg-white/85 text-ink backdrop-blur border border-white/60 hover:bg-white",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-13 px-7 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export function Button({ variant, size, className, ...props }: Common & ComponentProps<"button">) {
  return <button {...props} className={buttonClass(variant, size, className)} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  href,
  external,
  ...props
}: Common & Omit<ComponentProps<typeof Link>, "href"> & { href: string; external?: boolean }) {
  if (external || /^(https?:|tel:|mailto:)/.test(href)) {
    const isWeb = /^https?:/.test(href);
    return (
      <a
        href={href}
        className={buttonClass(variant, size, className)}
        {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {props.children}
      </a>
    );
  }
  return <Link href={href} {...props} className={buttonClass(variant, size, className)} />;
}
