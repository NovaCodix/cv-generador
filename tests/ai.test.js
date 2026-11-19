import { testCv } from "./fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  baseTemplate,
  buildAiPrompt,
  jsonSectionRange,
  parseCvJson,
} from "../src/ai.js";
import { extractCvText, pdfPageText } from "../src/extract.js";
import { createWord, createPdf } from "../src/export.js";
import { validate } from "../src/model.js";

test("El formato base es válido, vacío y puede pegarse desde una respuesta de IA", () => {
  const template = baseTemplate();
  assert.equal(validate(template).personal.name, "");
  assert.ok(template.experience[0].achievements);
  assert.ok(template.certifications[0]);
  assert.deepEqual(
    parseCvJson("```json\n" + JSON.stringify(template) + "\n```"),
    template,
  );
  assert.ok(!buildAiPrompt().includes("Persona de prueba"));
  assert.ok(
    buildAiPrompt("MI EXPERIENCIA REAL").endsWith(
      "MI EXPERIENCIA REAL\nFIN DEL TEXTO DEL CV ACTUAL",
    ),
  );
});

test("La navegación JSON distingue claves raíz, textos escapados y el resumen personal", () => {
  const text = JSON.stringify(
    {
      experience: [
        {
          education: "no saltar aquí",
          details: 'Texto con "education": y llaves {}',
        },
      ],
      personal: { name: "Persona", summary: "Perfil real" },
      education: [{ institution: "Universidad" }],
    },
    null,
    2,
  );
  const education = jsonSectionRange(text, "education");
  assert.ok(education.start > text.indexOf("Perfil real"));
  assert.equal(text.slice(education.start, education.end), '"education"');
  const summary = jsonSectionRange(text, "summary");
  assert.equal(text.slice(summary.start, summary.end), '"summary"');
  assert.equal(jsonSectionRange(text, "seccion_inexistente"), null);
});

test("Word puede extraerse localmente para preparar el prompt", async () => {
  const word = await createWord(testCv());
  const text = await extractCvText(new File([word], "cv.docx"));
  assert.ok(text.includes("Persona de prueba"));
  assert.ok(text.includes("Empresa Alfa"));
  assert.ok(text.includes("agosto 2025"));
});

test("PDF mantiene fechas a la derecha, cursiva, título centrado y texto recuperable", async () => {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = testCv(),
    pdf = await createPdf(data);
  const task = getDocument({
    data: new Uint8Array(pdf.output("arraybuffer")),
    useSystemFonts: true,
  });
  const doc = await task.promise;
  try {
    assert.equal(doc.numPages, 1);
    const p = await doc.getPage(1),
      content = await p.getTextContent();
    const company = content.items.find((x) => x.str === "Empresa Alfa");
    const date = content.items.find(
      (x) => x.str === "agosto 2025 – noviembre 2025",
    );
    assert.ok(company && date);
    assert.ok(date.transform[4] > company.transform[4] + 200);
    assert.notEqual(date.fontName, company.fontName);
    assert.ok(Math.abs(date.transform[5] - company.transform[5]) < 1);
    const title = content.items.find((x) => x.str === "Profesional de prueba");
    assert.ok(title.transform[4] > 100);
    assert.ok(
      pdfPageText(content.items).includes(
        "Empresa Alfa agosto 2025 – noviembre 2025",
      ),
    );
    assert.ok(pdf.output().includes("/BaseFont /Helvetica-Oblique"));
  } finally {
    await task.destroy();
  }
});
