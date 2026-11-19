export function pdfPageText(items) {
  const lines = [];
  for (const item of items) {
    if (!("str" in item) || !item.str.trim()) continue;
    const y = item.transform[5],
      x = item.transform[4];
    let line = lines.find((row) => Math.abs(row.y - y) < 2);
    if (!line) {
      line = { y, parts: [] };
      lines.push(line);
    }
    line.parts.push({ x, text: item.str });
  }
  return lines
    .sort((a, b) => b.y - a.y)
    .map((row) =>
      row.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.text)
        .join(" ")
        .replace(/[ \t]+/g, " ")
        .trim(),
    )
    .join("\n");
}

export async function extractCvText(file, onProgress = () => {}) {
  if (file.size > 20 * 1024 * 1024)
    throw new Error(
      "El archivo supera los 20 MB. Usa una versión más ligera del CV.",
    );
  const extension = file.name.split(".").pop().toLowerCase();
  const arrayBuffer = await file.arrayBuffer();
  let text;
  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
    const { default: workerSrc } =
      await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    const task = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      isEvalSupported: false,
    });
    let doc;
    try {
      doc = await task.promise;
      if (doc.numPages > 60)
        throw new Error(
          "El documento tiene más de 60 páginas. Sube solo las páginas de tu CV.",
        );
      const pages = [];
      for (let page = 1; page <= doc.numPages; page++) {
        onProgress(`Extrayendo página ${page} de ${doc.numPages}…`);
        const p = await doc.getPage(page);
        pages.push(pdfPageText((await p.getTextContent()).items));
        p.cleanup();
      }
      text = pages.join("\n\n");
    } catch (error) {
      if (error.name === "PasswordException")
        throw new Error(
          "El PDF está protegido con contraseña. Usa una copia sin protección.",
        );
      throw error;
    } finally {
      await task.destroy();
    }
  } else if (extension === "docx") {
    onProgress("Extrayendo texto de Word…");
    const { default: mammoth } = await import("mammoth/mammoth.browser.js");
    text = (await mammoth.extractRawText({ arrayBuffer })).value;
  } else if (extension === "doc") {
    throw new Error(
      "El formato Word antiguo .doc no es compatible. Abre el archivo en Word y guárdalo como .docx.",
    );
  } else {
    throw new Error("Selecciona un CV en PDF o Word (.docx).");
  }
  text = text.replace(/\u0000/g, "").trim();
  if (!text)
    throw new Error(
      "No se encontró texto extraíble. Si el PDF es una imagen escaneada, aplica OCR antes de importarlo o pega su texto manualmente.",
    );
  return text;
}
