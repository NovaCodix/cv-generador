import { blocksOf, designOf } from "./model.js";
import { styleOf, colorOf } from "./documentStyle.js";

export function download(blob, name) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export const filename = (data) =>
  (data.personal.name || "Mi CV")
    .replace(/[^\p{L}\p{N} -]/gu, "")
    .replaceAll(" ", "_");

export async function createWord(data) {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    BorderStyle,
    HeadingLevel,
    AlignmentType,
    TabStopType,
  } = await import("docx");
  const d = designOf(data),
    margin = Math.round(d.margin * 56.693);
  const pageWidth = d.paper === "letter" ? 12240 : 11906;
  const contentWidth = pageWidth - margin * 2;
  const run = (text, s, extra = {}) =>
    new TextRun({
      text,
      font: d.font,
      size: Math.round(s.size * 2),
      color: colorOf(s.color, d).slice(1),
      bold: s.bold || false,
      italics: s.italic || false,
      ...extra,
    });
  const children = blocksOf(data).map((b) => {
    const s = styleOf(b, d);
    if (b.kind === "rule")
      return new Paragraph({
        spacing: { before: s.before * 20, after: s.after * 20, line: 20 },
        border: {
          bottom: {
            color: d.primary.slice(1),
            style: BorderStyle.SINGLE,
            size: 12,
          },
        },
        children: [],
      });
    const right = b.right || "";
    return new Paragraph({
      heading: b.kind === "heading" ? HeadingLevel.HEADING_1 : undefined,
      alignment: s.center
        ? AlignmentType.CENTER
        : s.justify
          ? AlignmentType.JUSTIFIED
          : AlignmentType.LEFT,
      keepNext: ["heading", "entry", "subtitle"].includes(b.kind),
      widowControl: true,
      bullet: b.kind === "bullet" ? { level: 0 } : undefined,
      indent: b.kind === "bullet" ? { left: 200, hanging: 150 } : undefined,
      tabStops: right
        ? [{ type: TabStopType.RIGHT, position: contentWidth }]
        : undefined,
      border:
        b.kind === "heading"
          ? {
              bottom: {
                color: d.accent.slice(1),
                style: BorderStyle.SINGLE,
                size: 4,
                space: 2,
              },
            }
          : undefined,
      spacing: {
        before: Math.round(s.before * 20),
        after: Math.round(s.after * 20),
        line: Math.round(s.size * s.line * 20),
        lineRule: "exact",
      },
      children: [
        run(b.kind === "heading" ? b.text.toUpperCase() : b.text, s),
        ...(b.value ? [run(": " + b.value, s, { bold: false })] : []),
        ...(right
          ? [
              run("\t" + right, {
                ...s,
                size: 8.5 * d.scale,
                color: "muted",
                bold: false,
                italic: true,
              }),
            ]
          : []),
      ],
    });
  });
  const doc = new Document({
    creator: "Folio",
    title: `CV - ${data.personal.name || ""}`,
    description: "Currículum profesional",
    styles: {
      default: {
        document: { run: { font: d.font, size: 18, color: "4A4A4A" } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: pageWidth,
              height: d.paper === "letter" ? 15840 : 16838,
            },
            margin: {
              top: margin,
              bottom: margin,
              left: margin,
              right: margin,
            },
          },
        },
        children,
      },
    ],
  });
  return Packer.toBlob(doc);
}
export async function exportWord(data) {
  download(await createWord(data), `${filename(data)}.docx`);
}

export async function createPdf(data) {
  const { jsPDF } = await import("jspdf");
  const d = designOf(data),
    pdf = new jsPDF({ unit: "pt", format: d.paper });
  const width = pdf.internal.pageSize.getWidth(),
    height = pdf.internal.pageSize.getHeight(),
    margin = (d.margin * 72) / 25.4,
    contentWidth = width - margin * 2;
  const font = {
    Arial: "helvetica",
    Georgia: "times",
    "Courier New": "courier",
  }[d.font];
  let y = margin;
  pdf.setProperties({
    title: `CV - ${data.personal.name || ""}`,
    author: data.personal.name || "",
    creator: "Folio",
  });
  const ensure = (h) => {
    if (y + h > height - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };
  const setFont = (s) => {
    pdf.setFont(
      font,
      s.bold
        ? s.italic
          ? "bolditalic"
          : "bold"
        : s.italic
          ? "italic"
          : "normal",
    );
    pdf.setFontSize(s.size);
    pdf.setTextColor(colorOf(s.color, d));
  };
  const measure = (b) => {
    const s = styleOf(b, d);
    if (b.kind === "rule")
      return {
        b,
        s,
        lines: [],
        rightLines: [],
        line: 0,
        height: s.before + s.after + 2,
      };
    setFont(s);
    const text =
      b.kind === "heading"
        ? b.text.toUpperCase()
        : b.value
          ? `${b.text}: ${b.value}`
          : b.text;
    const indent = b.kind === "bullet" ? 10 * d.scale : 0;
    const rightStyle = {
      ...s,
      size: 8.5 * d.scale,
      color: "muted",
      bold: false,
      italic: true,
      line: 1.2,
    };
    let rightWidth = 0,
      rightLines = [];
    if (b.right) {
      setFont(rightStyle);
      rightWidth = Math.min(
        contentWidth * 0.35,
        Math.max(70 * d.scale, pdf.getTextWidth(b.right) + 2),
      );
      rightLines = pdf.splitTextToSize(b.right, rightWidth);
    }
    setFont(s);
    const textWidth =
      contentWidth - indent - (rightWidth ? rightWidth + 12 * d.scale : 0);
    const lines = pdf.splitTextToSize(text, textWidth);
    const line = s.size * s.line;
    return {
      b,
      s,
      lines,
      rightLines,
      rightStyle,
      line,
      textWidth,
      indent,
      height:
        s.before +
        Math.max(
          lines.length * line,
          rightLines.length * rightStyle.size * rightStyle.line,
        ) +
        s.after +
        (b.kind === "heading" ? 4 : 0),
    };
  };
  const rows = blocksOf(data).map(measure);
  for (let bi = 0; bi < rows.length; bi++) {
    const row = rows[bi],
      { b, s, lines, rightLines, rightStyle, line, textWidth, indent } = row;
    let keep = 0;
    if (["heading", "entry", "subtitle"].includes(b.kind)) {
      // Keep section titles with their first meaningful lines, without reserving
      // an arbitrary fixed blank area at the bottom of every page.
      for (let j = bi + 1; j < Math.min(rows.length, bi + 4); j++) {
        const next = rows[j];
        if (next.b.kind === "heading") break;
        keep += ["entry", "subtitle"].includes(next.b.kind)
          ? next.height
          : Math.min(next.height, (next.line || 0) * 2 + next.s.before);
        if (!["entry", "subtitle"].includes(next.b.kind)) break;
      }
    }
    const reserve = ["heading", "entry", "subtitle"].includes(b.kind)
      ? row.height + keep
      : Math.min(row.height, (line || 0) * 2 + s.before + s.after);
    const fresh = ensure(Math.min(reserve, height - margin * 2));
    y += fresh && ["heading", "entry"].includes(b.kind) ? 0 : s.before;
    if (b.kind === "rule") {
      pdf.setDrawColor(d.primary);
      pdf.setLineWidth(1.5);
      pdf.line(margin, y, width - margin, y);
      y += s.after + 1.5;
      continue;
    }
    if (rightLines.length) {
      const rowHeight = Math.max(
        lines.length * line,
        rightLines.length * rightStyle.size * rightStyle.line,
      );
      const count = Math.max(lines.length, rightLines.length);
      for (let i = 0; i < count; i++) {
        ensure(line);
        if (lines[i]) {
          setFont(s);
          pdf.text(lines[i], margin, y + s.size * 0.82);
        }
        if (rightLines[i]) {
          setFont(rightStyle);
          pdf.text(rightLines[i], width - margin, y + s.size * 0.82, {
            align: "right",
          });
        }
        y += line;
      }
      // Right-hand dates use a smaller font and share the company baseline.
      if (rowHeight > count * line) y += rowHeight - count * line;
    } else {
      for (let i = 0; i < lines.length; i++) {
        ensure(line);
        setFont(s);
        const baseline = y + s.size * 0.82;
        if (b.kind === "bullet" && i === 0) pdf.text("•", margin + 1, baseline);
        const centered = Boolean(s.center);
        const justify = s.justify && i < lines.length - 1;
        pdf.text(lines[i], centered ? width / 2 : margin + indent, baseline, {
          align: centered ? "center" : justify ? "justify" : "left",
          maxWidth: justify ? textWidth : undefined,
        });
        y += line;
      }
    }
    if (b.kind === "heading") {
      pdf.setDrawColor(d.accent);
      pdf.setLineWidth(0.6);
      pdf.line(margin, y + 1, width - margin, y + 1);
      y += 4;
    }
    y += s.after;
  }
  return pdf;
}
export async function exportPdf(data) {
  const pdf = await createPdf(data);
  pdf.save(`${filename(data)}.pdf`);
}
