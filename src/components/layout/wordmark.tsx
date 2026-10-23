import Link from "next/link";

/** The dealership's logo is a plain "Shital Motors" wordmark; set in the brand display face. */
export function Wordmark({ className = "", tone = "ink" }: { className?: string; tone?: "ink" | "white" }) {
  return (
    <Link href="/" className={`group inline-flex shrink-0 flex-col whitespace-nowrap leading-none ${className}`}>
      <span
        className={`font-display text-[1.32rem] font-[680] tracking-[-0.03em] [font-variation-settings:'wdth'_118] ${tone === "white" ? "text-white" : "text-ink"}`}
      >
        Shital Motors
      </span>
      <span aria-hidden className="mt-1 h-[2px] w-6 rounded-full bg-accent transition-[width] duration-500 ease-[var(--ease-out-quint)] group-hover:w-full" />
      <span className={`mt-1 text-[0.62rem] font-medium uppercase tracking-[0.2em] ${tone === "white" ? "text-white/70" : "text-muted"}`}>
        Authorised Mahindra Dealer
      </span>
    </Link>
  );
}
