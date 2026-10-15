import { Fragment, type ReactNode } from "react";

// Minimal renderer for the co-founder chat: **bold**, _italic_ / *italic*, bullets, numbered lists, > quotes.
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_]+_|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if ((part.startsWith("_") && part.endsWith("_")) || (part.startsWith("*") && part.endsWith("*") && part.length > 2))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="rounded bg-stone-100 px-1">{part.slice(1, -1)}</code>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    blocks.push(
      <Tag key={blocks.length} className={`${list.ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5`}>
        {list.items.map((it, i) => <li key={i}>{inline(it)}</li>)}
      </Tag>,
    );
    list = null;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)/);
    const num = line.match(/^\s*\d+[.)]\s+(.*)/);
    if (bullet || num) {
      const ordered = Boolean(num);
      if (list && list.ordered !== ordered) flush();
      list ??= { ordered, items: [] };
      list.items.push((bullet ?? num)![1]);
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const heading = line.match(/^#{1,4}\s+(.*)/);
    if (heading) blocks.push(<p key={blocks.length} className="font-semibold">{inline(heading[1])}</p>);
    else if (line.startsWith(">"))
      blocks.push(<blockquote key={blocks.length} className="border-l-2 border-indigo-300 pl-3 text-stone-600">{inline(line.replace(/^>\s?/, ""))}</blockquote>);
    else blocks.push(<p key={blocks.length}>{inline(line)}</p>);
  }
  flush();
  return <div className="space-y-2">{blocks}</div>;
}
