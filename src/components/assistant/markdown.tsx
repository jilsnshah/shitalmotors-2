import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A deliberately tiny markdown renderer for assistant replies: paragraphs,
 * bullet/numbered lists, **bold**, `code` and [links](/path). It builds React
 * elements (no innerHTML), so model output can never inject markup.
 */
export function Markdown({ text, onNavigate }: { text: string; onNavigate?: () => void }) {
  const blocks: ReactNode[] = [];
  const lines = text.replace(/\r/g, "").split("\n");
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) blocks.push(<p key={blocks.length}>{inline(para.join(" "), onNavigate)}</p>);
    para = [];
  };
  const flushList = () => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inline(it, onNavigate)}</li>);
    blocks.push(
      list.ordered ? (
        <ol key={blocks.length} className="list-decimal space-y-1 pl-5">{items}</ol>
      ) : (
        <ul key={blocks.length} className="list-disc space-y-1 pl-5 marker:text-subtle">{items}</ul>
      ),
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const heading = line.match(/^#{1,4}\s+(.*)$/);
    if (bullet || numbered) {
      flushPara();
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
    } else if (heading) {
      flushPara();
      flushList();
      blocks.push(<p key={blocks.length} className="font-semibold">{inline(heading[1], onNavigate)}</p>);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return <div className="space-y-2.5">{blocks}</div>;
}

const TOKEN = /(\*\*.+?\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;

function inline(text: string, onNavigate?: () => void): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    // Bold may wrap a link ("**[Scorpio](/cars/scorpio)**"), so parse its contents too.
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-ink">{inline(part.slice(2, -2), onNavigate)}</strong>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-sunken px-1 py-0.5 text-[0.85em]">{part.slice(1, -1)}</code>;
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const cls = "font-medium text-accent-strong underline decoration-accent/30 underline-offset-2 hover:decoration-accent";
      if (href.startsWith("/"))
        return (
          <Link key={i} href={href} className={cls} onClick={onNavigate}>
            {label}
          </Link>
        );
      if (/^https?:\/\//.test(href))
        return (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
            {label}
          </a>
        );
      return label;
    }
    return part;
  });
}
