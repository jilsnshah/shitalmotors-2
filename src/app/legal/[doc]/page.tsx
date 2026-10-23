import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dealer } from "@/lib/content";
import { PageHero } from "@/components/ui/primitives";

const DOCS = ["privacy", "terms", "disclaimer"] as const;
type Doc = (typeof DOCS)[number];
const isDoc = (d: string): d is Doc => (DOCS as readonly string[]).includes(d);

// Every valid slug is prerendered by generateStaticParams, so navigations are
// already instant. Opting out of instant validation (rather than adding a
// loading.tsx Suspense boundary) keeps unknown slugs returning a real HTTP 404.
export const instant = false;

export function generateStaticParams() {
  return DOCS.map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  if (!isDoc(doc)) return {};
  return { title: dealer.legal[doc].title, alternates: { canonical: `/legal/${doc}` } };
}

/** Legal text is reproduced from the dealership's current website. */
export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!isDoc(doc)) notFound();
  const { title, blocks } = dealer.legal[doc];

  const out: React.ReactNode[] = [];
  let items: string[] = [];
  const flush = () => {
    if (items.length) out.push(<ul key={`ul-${out.length}`} className="list-disc space-y-1.5 pl-5 marker:text-subtle">{items.map((t) => <li key={t}>{t}</li>)}</ul>);
    items = [];
  };
  blocks.forEach((b, i) => {
    if (b.kind === "item") return void items.push(b.text);
    flush();
    out.push(b.kind === "heading" ? <h2 key={i} className="pt-6 font-display text-xl font-semibold text-ink [font-variation-settings:'wdth'_106]">{b.text}</h2> : <p key={i}>{b.text}</p>);
  });
  flush();

  return (
    <>
      <PageHero breadcrumbs={[{ label: "Home", href: "/" }, { label: title }]} eyebrow="Legal" title={title} />
      <article className="container-x mt-12 max-w-3xl space-y-4 leading-relaxed text-ink-2">{out}</article>
    </>
  );
}
