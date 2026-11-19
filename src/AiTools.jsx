import { useRef, useState } from "react";
import {
  Copy,
  Download,
  Upload,
  Sparkles,
  LoaderCircle,
  Code2,
} from "lucide-react";
import { baseTemplate, buildAiPrompt } from "./ai.js";
import { extractCvText } from "./extract.js";
import { download } from "./export.js";

export default function AiTools({
  draft,
  onDraftChange,
  onMessage,
  onOpenJson,
}) {
  const { source, prompt, fileName } = draft;
  const setSource = (value) =>
    onDraftChange((prev) => ({ ...prev, source: value }));
  const setPrompt = (value) =>
    onDraftChange((prev) => ({ ...prev, prompt: value }));
  const setFileName = (value) =>
    onDraftChange((prev) => ({ ...prev, fileName: value }));
  const [status, setStatus] = useState(""),
    [error, setError] = useState("");
  const input = useRef(null),
    output = useRef(null),
    extracting = Boolean(status);
  const copy = async (text) => {
    setPrompt(text);
    try {
      await navigator.clipboard.writeText(text);
      onMessage("Prompt copiado. Pégalo en ChatGPT o en tu IA de preferencia.");
    } catch {
      requestAnimationFrame(() => {
        output.current?.focus();
        output.current?.select();
      });
      onMessage(
        "El navegador no permitió copiar. El prompt está seleccionado para copiarlo manualmente.",
      );
    }
  };
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setStatus("Leyendo tu CV…");
    try {
      const text = await extractCvText(file, setStatus);
      setFileName(file.name);
      setSource(text);
      setPrompt(buildAiPrompt(text));
      onMessage("Texto extraído. Revísalo antes de copiar el prompt.");
    } catch (err) {
      setError(err.message);
    } finally {
      setStatus("");
      event.target.value = "";
    }
  };
  return (
    <div className="editor-card ai-card">
      <div className="card-heading">
        <div>
          <span className="section-kicker">DE TU HISTORIA AL JSON</span>
          <h2>Prepara tu CV con IA</h2>
          <p>
            Copia la estructura, completa tu información y trae el JSON de
            vuelta.
          </p>
        </div>
        <span className="heading-icon">
          <Sparkles size={22} />
        </span>
      </div>
      <div className="ai-body">
        <section>
          <h3>Empieza con el formato base</h3>
          <p>
            Incluye las secciones y los campos esenciales, sin datos personales
            de ejemplo.
          </p>
          <div className="ai-actions">
            <button
              className="button secondary"
              onClick={() =>
                download(
                  new Blob([JSON.stringify(baseTemplate(), null, 2)], {
                    type: "application/json",
                  }),
                  "cv-formato-base.json",
                )
              }
            >
              <Download size={16} /> Descargar formato base
            </button>
            <button
              className="button primary"
              onClick={() => copy(buildAiPrompt())}
            >
              <Copy size={16} /> Copiar para IA
            </button>
          </div>
        </section>
        <section>
          <h3>¿Ya tienes un currículum?</h3>
          <p>
            Sube tu PDF o Word (.docx). Extraeremos su texto en este dispositivo
            para preparar el prompt con tu información.
          </p>
          <input
            ref={input}
            type="file"
            accept=".pdf,.docx,.doc"
            hidden
            onChange={upload}
          />
          <button
            disabled={extracting}
            className="ai-upload"
            onClick={() => input.current.click()}
          >
            {extracting ? (
              <LoaderCircle className="spin" size={24} />
            ) : (
              <Upload size={24} />
            )}
            <strong>{status || "Subir mi CV actual"}</strong>
            <span>PDF con texto o Word .docx · hasta 20 MB</span>
          </button>
          {fileName && <p className="ai-filename">{fileName}</p>}
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <label className="control-label">
            Texto de tu CV · revisa o pega tu contenido
            <textarea
              rows={9}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="También puedes pegar aquí el texto de tu currículum…"
            />
          </label>
          <button
            className="button primary"
            disabled={!source.trim() || extracting}
            onClick={() => copy(buildAiPrompt(source))}
          >
            <Copy size={16} /> Copiar prompt con mi CV
          </button>
        </section>
        <section>
          <h3>Prompt listo para usar</h3>
          <p>
            La IA te preguntará por información faltante y devolverá el JSON
            cuando esté completo. Puedes editar este prompt antes de copiarlo.
          </p>
          <textarea
            ref={output}
            className="ai-prompt"
            aria-label="Prompt para IA"
            rows={12}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <div className="ai-actions">
            <button className="button secondary" onClick={() => copy(prompt)}>
              <Copy size={16} /> Copiar prompt
            </button>
            <button
              className="text-button"
              onClick={() =>
                download(
                  new Blob([prompt], { type: "text/plain;charset=utf-8" }),
                  "prompt-para-mi-cv.txt",
                )
              }
            >
              <Download size={15} /> Descargar prompt
            </button>
          </div>
        </section>
        <section className="ai-return">
          <Code2 size={22} />
          <div>
            <h3>Pega el JSON que te devuelva la IA</h3>
            <p>
              Abre el editor JSON, reemplaza el contenido y pulsa «Aplicar
              JSON». También puedes cargar el archivo JSON.
            </p>
            <button className="button secondary" onClick={onOpenJson}>
              Abrir editor JSON
            </button>
          </div>
        </section>
        <p className="ai-privacy">
          No se envía el archivo a ninguna IA automáticamente. Tú decides dónde
          pegar el prompt. Los PDF escaneados necesitan OCR; los Word antiguos
          .doc deben guardarse como .docx.
        </p>
      </div>
    </div>
  );
}
