import { testCv } from "./fixture.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import { unzipSync, strFromU8 } from "fflate";
import {
  emptyData,
  designOf,
  validate,
  sectionKeys,
  blocksOf,
  move,
} from "../src/model.js";
import { createPdf, createWord } from "../src/export.js";

test("Un CV vacío conserva las estructuras y admite temas del modelo original", () => {
  const d = emptyData();
  assert.equal(validate(d).personal.name, "");
  assert.equal(d.experience.length, 0);
  assert.deepEqual(blocksOf(d), []);
  delete d._meta;
  d.theme = "rosa";
  assert.equal(designOf(d).primary, "#831843");
  d._meta = { design: { primary: "#123456" } };
  assert.equal(designOf(d).primary, "#123456");
});

test("El JSON del usuario se importa sin perder campos y rechaza estructuras inválidas", () => {
  const d = testCv();
  assert.deepEqual(validate(JSON.parse(JSON.stringify(d))), d);
  assert.throws(
    () => validate({ personal: {}, experience: [null] }),
    /experience/,
  );
  assert.throws(
    () => validate({ personal: {}, _meta: { order: "experience" } }),
    /order/,
  );
  assert.throws(
    () => validate({ personal: {}, _meta: { design: { scale: 0 } } }),
    /scale/,
  );
});

test("Las secciones y elementos respetan el orden; se omite contenido oculto", () => {
  const d = testCv();
  d._meta.order = ["education", "summary", "experience"];
  d._meta.hidden = ["memberships"];
  d.experience = move(d.experience, 0, 1);
  d.publicaciones = [
    { name: "Artículo propio", description: "Investigación jurídica" },
  ];
  d._meta.titles.publicaciones = "Publicaciones";
  assert.equal(sectionKeys(d)[0], "education");
  const blocks = blocksOf(d);
  assert.equal(blocks.find((x) => x.kind === "heading").text, "Educación");
  assert.ok(!blocks.some((x) => x.text.includes("Asociación de prueba")));
  assert.ok(blocks.some((x) => x.text === "Artículo propio"));
  const entries = blocks.filter((x) => x.kind === "entry").map((x) => x.text);
  assert.ok(
    entries.findIndex((x) => x.startsWith("Empresa Beta")) <
      entries.findIndex((x) => x.startsWith("Empresa Alfa")),
  );
});

test("Word contiene texto, secciones personalizadas y formato editable, sin tablas", async () => {
  const d = testCv();
  d.custom = [
    {
      name: "Reconocimiento académico",
      description: "Premio verificable 2026",
    },
  ];
  const blob = await createWord(d);
  const zip = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  const xml = strFromU8(zip["word/document.xml"]);
  assert.ok(xml.includes(d.personal.name));
  assert.ok(xml.includes("Reconocimiento académico"));
  assert.ok(xml.includes("Premio verificable 2026"));
  assert.ok(xml.includes("w:numPr"));
  assert.ok(!xml.includes("<w:tbl>"));
});

test("PDF pagina textos extensos y conserva texto seleccionable", async () => {
  const d = testCv();
  d.custom = [
    {
      name: "Texto extenso",
      description: "Experiencia profesional verificable. ".repeat(1000),
    },
  ];
  const pdf = await createPdf(d);
  assert.ok(pdf.getNumberOfPages() > 3);
  const content = pdf.output();
  assert.ok(content.startsWith("%PDF-"));
  assert.ok(content.includes("Persona de prueba"));
  assert.ok(!content.includes("/Subtype /Image"));
});
