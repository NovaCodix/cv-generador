// Sizes and spacing follow the supplied ReportLab reference, in points.
export const documentStyle = {
  name: {
    size: 26,
    line: 1.15,
    after: 4,
    color: "primary",
    bold: true,
    center: true,
  },
  title: {
    size: 13,
    line: 1.23,
    after: 6,
    color: "accent",
    bold: true,
    center: true,
  },
  contact: { size: 8.5, line: 1.15, after: 3, color: "muted", center: true },
  links: { size: 8.5, line: 1.15, after: 8, color: "accent", center: true },
  rule: { size: 0, before: 2, after: 6 },
  heading: {
    size: 10,
    line: 1.2,
    before: 8,
    after: 3,
    color: "primary",
    bold: true,
  },
  entry: {
    size: 10,
    line: 1.2,
    before: 4,
    after: 1,
    color: "accent",
    bold: true,
  },
  subtitle: { size: 9.5, line: 1.2, after: 1, color: "primary", bold: true },
  text: { size: 9, after: 2, color: "body", justify: true },
  bullet: { size: 9, after: 2, color: "body" },
  detail: { size: 8.5, after: 2, color: "muted", italic: true },
  skills: { size: 9, after: 2, color: "body" },
};
export function styleOf(block, design) {
  const s = documentStyle[block.kind] || documentStyle.text;
  return {
    ...s,
    size: s.size * design.scale,
    before: (s.before || 0) * design.scale,
    after: (s.after || 0) * design.scale,
    line: s.line || design.spacing,
  };
}
export function colorOf(key, d) {
  return (
    { primary: d.primary, accent: d.accent, muted: "#6b7280", body: "#4a4a4a" }[
      key
    ] || "#4a4a4a"
  );
}
