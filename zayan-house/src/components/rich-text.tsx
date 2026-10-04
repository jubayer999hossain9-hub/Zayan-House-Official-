/**
 * Renders simple page text safely (no HTML is ever interpreted):
 *  - blank line = new paragraph
 *  - a line starting with "## " = heading
 *  - lines starting with "- " = bullet list
 */
export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-4 leading-relaxed text-charcoal/90">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const out: React.ReactNode[] = [];
        let list: string[] = [];
        const flush = (key: string) => {
          if (list.length) {
            out.push(<ul key={key} className="list-disc space-y-1.5 pl-5">{list.map((l, j) => <li key={j}>{l}</li>)}</ul>);
            list = [];
          }
        };
        lines.forEach((line, j) => {
          if (line.startsWith("## ")) {
            flush(`l${i}-${j}`);
            out.push(<h2 key={`h${i}-${j}`} className="!mt-8 text-2xl text-green">{line.slice(3)}</h2>);
          } else if (line.startsWith("- ")) {
            list.push(line.slice(2));
          } else {
            flush(`l${i}-${j}`);
            out.push(<p key={`p${i}-${j}`}>{line}</p>);
          }
        });
        flush(`l${i}-end`);
        return <div key={i} className="space-y-4">{out}</div>;
      })}
    </div>
  );
}
