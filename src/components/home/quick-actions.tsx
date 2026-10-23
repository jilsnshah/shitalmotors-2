import Link from "next/link";
import { CalendarCheck, IndianRupee, MapPin, Wrench, ArrowUpRight } from "lucide-react";

const actions = [
  { href: "/get-price", icon: IndianRupee, title: "Get on-road price", text: "For any model and variant, from your nearest showroom." },
  { href: "/test-drive", icon: CalendarCheck, title: "Book a test drive", text: "Pick a model and the showroom that suits you." },
  { href: "/service#book", icon: Wrench, title: "Book a service", text: "Schedule, accidental or repair work at our workshops." },
  { href: "/locations", icon: MapPin, title: "Find an outlet", text: "Showrooms and workshops with hours and directions." },
];

export function QuickActions() {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {actions.map(({ href, icon: Icon, title, text }) => (
        <li key={href}>
          <Link
            href={href}
            className="group flex h-full flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-xs transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card sm:p-5"
          >
            <span className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-sunken text-ink transition-colors group-hover:bg-accent group-hover:text-white">
                <Icon aria-hidden className="size-5" />
              </span>
              <ArrowUpRight aria-hidden className="size-4 text-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
            </span>
            <span>
              <span className="block font-medium text-ink">{title}</span>
              <span className="mt-1 hidden text-sm leading-snug text-muted sm:block">{text}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
