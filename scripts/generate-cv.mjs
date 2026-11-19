import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validate } from "../src/model.js";
import { createPdf, createWord, filename } from "../src/export.js";

const usage =
  'Uso: npm run generate -- "ruta/mi-cv.json" ["carpeta-de-salida"]';

// Uses the application generators, without depending on example files.
try {
  const input = process.argv[2];
  if (!input || ["--help", "-h"].includes(input)) {
    console.log(usage);
    console.log(
      "Indica tu propio JSON, exportado desde la aplicación o completado con el formato base.",
    );
    process.exit(input ? 0 : 1);
  }
  const output = resolve(process.argv[3] || "outputs");
  const data = validate(JSON.parse(await readFile(input, "utf8")));
  const pdf = await createPdf(data);
  const word = await createWord(data);
  await mkdir(output, { recursive: true });
  const base = `${output}/${filename(data)}`;
  await writeFile(`${base}.pdf`, new Uint8Array(pdf.output("arraybuffer")));
  await writeFile(`${base}.docx`, new Uint8Array(await word.arrayBuffer()));
  console.log(`PDF (${pdf.getNumberOfPages()} páginas): ${base}.pdf`);
  console.log(`Word: ${base}.docx`);
} catch (error) {
  console.error(`No se pudo generar el CV: ${error.message}`);
  process.exitCode = 1;
}
