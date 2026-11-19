import { blocksOf, designOf } from "./model.js";
import { styleOf, colorOf } from "./documentStyle.js";

export default function ResumePreview({ data, zoom }) {
  const d = designOf(data),
    px = (n) => (n * 4) / 3;
  return (
    <article
      className="cv-paper"
      style={{
        width: d.paper === "a4" ? 794 : 816,
        minHeight: d.paper === "a4" ? 1123 : 1056,
        zoom,
        padding: `${d.margin * 3.78}px`,
        fontFamily: d.font,
        "--cv-primary": d.primary,
        "--cv-accent": d.accent,
      }}
    >
      {blocksOf(data).map((b, i) => {
        const s = styleOf(b, d);
        return (
          <div
            key={i}
            className={`cv-${b.kind}`}
            style={{
              fontSize: px(s.size),
              lineHeight: s.line,
              marginTop: px(s.before),
              marginBottom: px(s.after),
              fontWeight: s.bold ? 700 : 400,
              fontStyle: s.italic ? "italic" : "normal",
              color: colorOf(s.color, d),
              textAlign: s.center ? "center" : s.justify ? "justify" : "left",
              display: b.right ? "flex" : "block",
              gap: b.right ? 16 : undefined,
              paddingLeft: b.kind === "bullet" ? px(10 * d.scale) : 0,
              textIndent: b.kind === "bullet" ? -px(8 * d.scale) : 0,
              borderBottom:
                b.kind === "heading"
                  ? `0.8px solid ${d.accent}`
                  : b.kind === "rule"
                    ? `2px solid ${d.primary}`
                    : undefined,
              paddingBottom: b.kind === "heading" ? px(3) : 0,
            }}
          >
            <span className="cv-left">
              {b.kind === "bullet" ? "•  " : ""}
              {b.kind === "heading" ? b.text.toUpperCase() : b.text}
              {b.value && <span className="cv-skill-value">: {b.value}</span>}
            </span>
            {b.right && (
              <span
                className="cv-right"
                style={{ fontSize: px(8.5 * d.scale) }}
              >
                {b.right}
              </span>
            )}
          </div>
        );
      })}
    </article>
  );
}
