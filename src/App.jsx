import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  FileText,
  Code2,
  Download,
  Upload,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCheck,
  Trash2,
  X,
  Palette,
  PanelLeftClose,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Settings2,
  BriefcaseBusiness,
  GraduationCap,
  UserRound,
  Languages,
  FolderOpen,
  HeartHandshake,
  Award,
  CircleHelp,
  ZoomIn,
  ZoomOut,
  FileJson,
  LoaderCircle,
} from "lucide-react";
import {
  emptyData,
  validate,
  sectionKeys,
  titleOf,
  designOf,
  schemas,
  label,
  move,
  atsChecks,
} from "./model";
import { download, filename, exportWord, exportPdf, createPdf } from "./export";
import "./App.css";
import FieldEditor from "./FieldEditor.jsx";
import AiTools from "./AiTools.jsx";
import ResumePreview from "./ResumePreview.jsx";
import { buildAiPrompt, parseCvJson, jsonSectionRange } from "./ai.js";

const icons = {
  personal: UserRound,
  summary: FileText,
  experience: BriefcaseBusiness,
  education: GraduationCap,
  skills: Sparkles,
  languages: Languages,
  projects: FolderOpen,
  volunteering: HeartHandshake,
  memberships: Award,
  certifications: ShieldCheck,
};
function Icon({ name, ...props }) {
  const Component = Object.hasOwn(icons, name) ? icons[name] : FileText;
  return <Component size={18} {...props} />;
}
const storageKey = "folio-cv-v1";
function load() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? validate(JSON.parse(saved)) : emptyData();
  } catch {
    return emptyData();
  }
}

export default function App() {
  const [data, setData] = useState(load),
    [mode, setMode] = useState("visual"),
    [tab, setTab] = useState("content"),
    [active, setActive] = useState("personal"),
    [json, setJson] = useState(""),
    [jsonError, setJsonError] = useState(""),
    [toast, setToast] = useState(""),
    [saved, setSaved] = useState(true),
    [addModal, setAddModal] = useState(false),
    [newTitle, setNewTitle] = useState(""),
    [newType, setNewType] = useState("custom"),
    [exportMenu, setExportMenu] = useState(false),
    [busy, setBusy] = useState(""),
    [zoom, setZoom] = useState(0.72),
    [pdfUrl, setPdfUrl] = useState(""),
    [mobilePreview, setMobilePreview] = useState(false),
    [deleteKey, setDeleteKey] = useState(null);
  const [history, setHistory] = useState([]),
    [future, setFuture] = useState([]);
  const [aiDraft, setAiDraft] = useState(() => ({
    source: "",
    prompt: buildAiPrompt(),
    fileName: "",
  }));
  const jsonEditor = useRef(null);
  const previewViewport = useRef(null);
  useLayoutEffect(() => {
    if (mode !== "json" || !jsonEditor.current) return;
    const element = jsonEditor.current,
      range = jsonSectionRange(element.value, active);
    if (!range) return;
    element.focus({ preventScroll: true });
    element.setSelectionRange(range.start, range.end);
    const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 21.6;
    element.scrollTop = Math.max(0, (range.line - 2) * lineHeight);
  }, [active, mode]);
  const fileInput = useRef(),
    dragSection = useRef(null),
    sections = sectionKeys(data),
    design = designOf(data),
    checks = atsChecks(data);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        setSaved(true);
      } catch {
        setSaved("error");
      }
    }, 450);
    return () => clearTimeout(timer);
  }, [data]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(
    () => () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    },
    [pdfUrl],
  );
  useEffect(() => {
    const element = previewViewport.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0)
        setZoom(
          Math.min(
            0.85,
            Math.max(
              0.3,
              (entry.contentRect.width - 16) /
                (design.paper === "a4" ? 794 : 816),
            ),
          ),
        );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [design.paper]);
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        setAddModal(false);
        setDeleteKey(null);
        setExportMenu(false);
        setPdfUrl("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const update = (next) => {
    setHistory([...history.slice(-49), data]);
    setFuture([]);
    setData(next);
    setSaved(false);
    setPdfUrl("");
  };
  const undo = () => {
    if (!history.length) return;
    setFuture([...future, data]);
    const prev = history.at(-1);
    setHistory(history.slice(0, -1));
    setData(prev);
    setSaved(false);
    setPdfUrl("");
    setJson(JSON.stringify(prev, null, 2));
    setActive("personal");
  };
  const redo = () => {
    if (!future.length) return;
    setHistory([...history, data]);
    const next = future.at(-1);
    setFuture(future.slice(0, -1));
    setData(next);
    setSaved(false);
    setPdfUrl("");
    setJson(JSON.stringify(next, null, 2));
    setActive("personal");
  };
  const meta = (patch) =>
    update({ ...data, _meta: { ...data._meta, ...patch } });
  const setDesign = (patch) => meta({ design: { ...design, ...patch } });
  const setSection = (key, v) =>
    update(
      key === "summary"
        ? { ...data, personal: { ...data.personal, summary: v } }
        : { ...data, [key]: v },
    );
  const title = (key) => titleOf(data, key);
  const reorder = (from, to) => meta({ order: move(sections, from, to) });
  const switchMode = (next) => {
    if (next === mode) return true;
    if (
      mode === "json" &&
      json !== JSON.stringify(data, null, 2) &&
      !applyJson()
    )
      return false;
    if (next === "json") {
      setJson(JSON.stringify(data, null, 2));
      setJsonError("");
    }
    setMode(next);
    return true;
  };
  const applyJson = () => {
    try {
      const next = parseCvJson(json);
      update(next);
      if (
        !["personal", "summary"].includes(active) &&
        !Object.hasOwn(next, active)
      )
        setActive("personal");
      setJsonError("");
      setToast("JSON aplicado al currículum");
      return true;
    } catch (e) {
      setJsonError(e.message);
      return false;
    }
  };
  const doExport = async (format) => {
    if (mode === "json" && json !== JSON.stringify(data, null, 2)) {
      setToast("Aplica los cambios del JSON antes de exportar.");
      setExportMenu(false);
      return;
    }
    setBusy(format);
    setExportMenu(false);
    try {
      if (format === "word") await exportWord(data);
      else await exportPdf(data);
      setToast(`Tu archivo ${format === "word" ? "Word" : "PDF"} está listo`);
    } catch (e) {
      setToast(`No se pudo exportar: ${e.message}`);
    } finally {
      setBusy("");
    }
  };
  const importJson = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const next = parseCvJson(await file.text());
      update(next);
      setActive("personal");
      setJson(JSON.stringify(next, null, 2));
      setJsonError("");
      setToast("Currículum importado correctamente");
    } catch (err) {
      setToast(`No se pudo cargar: ${err.message}`);
    }
    e.target.value = "";
  };
  const addSection = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const base =
      newType === "custom"
        ? newTitle
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "") || "seccion"
        : newType;
    let key = base,
      n = 2;
    while (
      Object.hasOwn(data, key) ||
      [
        "summary",
        "__proto__",
        "constructor",
        "prototype",
        "personal",
        "_meta",
        "theme",
      ].includes(key)
    )
      key = `${base}_${n++}`;
    const value =
      newType === "text"
        ? ""
        : newType === "skills"
          ? { practices: [] }
          : [
              structuredClone(
                schemas[newType] || { name: "", description: "" },
              ),
            ];
    update({
      ...data,
      [key]: value,
      _meta: {
        ...data._meta,
        order: [...sections, key],
        titles: { ...data._meta?.titles, [key]: newTitle.trim() },
      },
    });
    setActive(key);
    setNewTitle("");
    setAddModal(false);
    setTab("content");
  };
  const saveJson = () => {
    try {
      const current = mode === "json" ? parseCvJson(json) : data;
      download(
        new Blob([JSON.stringify(current, null, 2)], {
          type: "application/json",
        }),
        filename(current) + ".json",
      );
      setExportMenu(false);
    } catch (error) {
      setJsonError(error.message);
      setToast("Corrige el JSON antes de descargarlo.");
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <a href="#" className="brand" aria-label="Folio inicio">
          <span className="brand-symbol">
            <FileText size={23} />
          </span>
          folio<span className="brand-dot">.</span>
        </a>
        <div className="header-divider" />
        <div className="project-name">
          Mi currículum <span className="project-badge">PERSONAL</span>
        </div>
        <div className="header-right">
          <button
            className="icon-button history-button"
            title="Deshacer"
            disabled={!history.length}
            onClick={undo}
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="icon-button history-button"
            title="Rehacer"
            disabled={!future.length}
            onClick={redo}
          >
            <RotateCcw size={16} style={{ transform: "scaleX(-1)" }} />
          </button>
          <span className="save-state">
            <CheckCheck size={16} />
            {saved === "error"
              ? "No se pudo guardar: descarga tu JSON"
              : saved
                ? "Guardado en este navegador"
                : "Guardando…"}
          </span>
          <button
            className="button secondary import-top"
            onClick={() => fileInput.current.click()}
          >
            <Upload size={16} /> Importar JSON
          </button>
          <div className="export-wrap">
            <button
              className="button primary"
              onClick={() => setExportMenu(!exportMenu)}
              disabled={Boolean(busy)}
            >
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Download size={17} />
              )}{" "}
              Exportar CV <ChevronDown size={15} />
            </button>
            {exportMenu && (
              <>
                <button
                  aria-label="Cerrar menú"
                  className="menu-scrim"
                  onClick={() => setExportMenu(false)}
                />
                <div className="dropdown">
                  <button onClick={() => doExport("pdf")}>
                    <FileText size={17} />
                    <span>
                      Documento PDF
                      <small>Texto seleccionable · listo para enviar</small>
                    </span>
                  </button>
                  <button onClick={() => doExport("word")}>
                    <FileText size={17} />
                    <span>
                      Microsoft Word<small>Archivo .docx editable</small>
                    </span>
                  </button>
                  <button onClick={saveJson}>
                    <FileJson size={17} />
                    <span>
                      Datos JSON
                      <small>Contenido y configuración de diseño</small>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <input
        type="file"
        accept=".json,application/json"
        hidden
        ref={fileInput}
        onChange={importJson}
      />
      <aside className="sidebar">
        <div className="workspace-label">TU ESPACIO DE TRABAJO</div>
        <div className="sidebar-tabs">
          <button
            className={tab === "content" ? "selected" : ""}
            onClick={() => {
              setTab("content");
              setMobilePreview(false);
            }}
          >
            <FileText size={18} /> Contenido
          </button>
          <button
            className={tab === "design" ? "selected" : ""}
            onClick={() => {
              if (!switchMode("visual")) return;
              setTab("design");
              setMobilePreview(false);
            }}
          >
            <Palette size={18} /> Diseño{" "}
            <span className="new-badge">NUEVO</span>
          </button>
        </div>
        <button
          className={`ai-nav ${tab === "ai" ? "selected" : ""}`}
          onClick={() => {
            if (switchMode("visual")) {
              setTab("ai");
              setMobilePreview(false);
            }
          }}
        >
          <Sparkles size={18} /> Preparar con IA
        </button>
        <div className="side-separator" />
        <div className="sections-label">
          SECCIONES <span>{sections.length + 1}</span>
        </div>
        <nav aria-label="Secciones del currículum">
          <button
            className={`section-nav ${active === "personal" && tab === "content" ? "active" : ""}`}
            onClick={() => {
              setActive("personal");
              setTab("content");
              setMobilePreview(false);
            }}
          >
            <Icon name="personal" />
            <span>Datos personales</span>
            <Check size={14} className="nav-check" />
          </button>
          {sections.map((key, index) => (
            <div
              key={key}
              className={`nav-row ${active === key && tab === "content" ? "active" : ""} ${data._meta?.hidden?.includes(key) ? "is-hidden" : ""}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragSection.current !== null)
                  reorder(dragSection.current, index);
                dragSection.current = null;
              }}
            >
              <span
                className="section-grip"
                draggable
                title="Arrastrar sección"
                onDragStart={(e) => {
                  dragSection.current = index;
                  e.dataTransfer.setData("text/plain", key);
                }}
                onDragEnd={() => {
                  dragSection.current = null;
                }}
              >
                <GripVertical size={13} />
              </span>
              <button
                onClick={() => {
                  setActive(key);
                  setTab("content");
                  setMobilePreview(false);
                }}
              >
                <Icon name={key} />
                <span>{title(key)}</span>
              </button>
              <div className="nav-reorder">
                <button
                  title="Subir sección"
                  disabled={!index}
                  onClick={() => reorder(index, index - 1)}
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  title="Bajar sección"
                  disabled={index === sections.length - 1}
                  onClick={() => reorder(index, index + 1)}
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            </div>
          ))}
        </nav>
        <button
          className="add-section"
          onClick={() => {
            setNewType("custom");
            setAddModal(true);
          }}
        >
          <Plus size={17} /> Añadir sección
        </button>
        <p className="drag-tip">
          <GripVertical size={14} /> Arrastra para cambiar el orden
        </p>
        <button
          className="new-cv-button"
          onClick={() => setDeleteKey("$reset")}
        >
          <Trash2 size={15} /> Limpiar todo
        </button>
        <div className="mobile-history">
          <button
            className="icon-button"
            title="Deshacer"
            disabled={!history.length}
            onClick={undo}
          >
            <RotateCcw size={16} />
          </button>
          <button
            className="icon-button"
            title="Rehacer"
            disabled={!future.length}
            onClick={redo}
          >
            <RotateCcw size={16} style={{ transform: "scaleX(-1)" }} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <ShieldCheck size={20} />
            <div>
              Tus datos son tuyos
              <small>Se guardan solo en este navegador.</small>
            </div>
          </div>
          <button className="help-link" onClick={() => setTab("ats")}>
            <CircleHelp size={16} /> Guía para un mejor CV
          </button>
        </div>
      </aside>
      <main className={`main-area ${mobilePreview ? "show-preview" : ""}`}>
        <div className="workspace-top">
          <div>
            <div className="eyebrow">UN NUEVO CAPÍTULO EMPIEZA AQUÍ</div>
            <h1>
              Tu experiencia, bien contada<span>.</span>
            </h1>
            <p>Construye un currículum que abra la siguiente puerta.</p>
          </div>
          <span className="local-badge">
            <span /> Todo listo para crear
          </span>
        </div>
        <div className="mobile-switch">
          <button
            className={!mobilePreview ? "selected" : ""}
            onClick={() => setMobilePreview(false)}
          >
            Editor
          </button>
          <button
            className={mobilePreview ? "selected" : ""}
            onClick={() => setMobilePreview(true)}
          >
            Vista previa
          </button>
        </div>
        <div className="work-grid">
          <section className="editor-column">
            <div className="editor-tabs">
              <div>
                <button
                  className={mode === "visual" ? "selected" : ""}
                  onClick={() => switchMode("visual")}
                >
                  <Settings2 size={16} /> Editor visual
                </button>
                <button
                  className={mode === "json" ? "selected" : ""}
                  onClick={() => switchMode("json")}
                >
                  <Code2 size={17} /> Editor JSON
                </button>
              </div>
              <span className="live-label">
                <span /> EN VIVO
              </span>
            </div>
            {tab === "ai" && mode === "visual" ? (
              <AiTools
                draft={aiDraft}
                onDraftChange={setAiDraft}
                onMessage={setToast}
                onOpenJson={() => switchMode("json")}
              />
            ) : mode === "json" ? (
              <div className="editor-card json-card">
                <div className="card-heading">
                  <div>
                    <h2>Tu CV, en JSON</h2>
                    <p>
                      Sección seleccionada:{" "}
                      <strong>
                        {active === "personal"
                          ? "Datos personales"
                          : title(active)}
                      </strong>
                      . El editor salta a su ubicación en el JSON.
                    </p>
                  </div>
                  <Code2 size={22} />
                </div>
                <div className="json-actions">
                  <button
                    className="text-button"
                    onClick={() => {
                      setJson(JSON.stringify(data, null, 2));
                      setJsonError("");
                    }}
                  >
                    <RotateCcw size={14} /> Descartar cambios
                  </button>
                  <button
                    className="button small secondary"
                    onClick={() => {
                      try {
                        setJson(JSON.stringify(parseCvJson(json), null, 2));
                        setJsonError("");
                      } catch (e) {
                        setJsonError(e.message);
                      }
                    }}
                  >
                    Formatear
                  </button>
                  <button
                    className="text-button"
                    onClick={() => fileInput.current.click()}
                  >
                    <Upload size={14} /> Cargar JSON
                  </button>
                </div>
                <textarea
                  ref={jsonEditor}
                  className="json-editor"
                  aria-label="Editor JSON del currículum"
                  spellCheck={false}
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                />
                {jsonError && (
                  <p className="error-text" role="alert">
                    {jsonError}
                  </p>
                )}
                <div className="json-footer">
                  <span>
                    {json !== JSON.stringify(data, null, 2)
                      ? "Cambios pendientes de aplicar"
                      : "Sincronizado con el editor visual"}
                  </span>
                  <button className="button primary" onClick={applyJson}>
                    <Check size={16} /> Aplicar JSON
                  </button>
                </div>
              </div>
            ) : tab === "design" ? (
              <div className="editor-card">
                <div className="card-heading">
                  <div>
                    <h2>Hazlo tuyo</h2>
                    <p>Un diseño profesional, con tu personalidad.</p>
                  </div>
                  <Palette size={23} />
                </div>
                <div className="design-body">
                  <label className="control-label">Paleta de color</label>
                  <div className="palette-options">
                    {[
                      ["Bosque", "#244936", "#56785e"],
                      ["Océano", "#1b3a6b", "#0f7b6c"],
                      ["Borgoña", "#6b1124", "#a82845"],
                      ["Grafito", "#292d33", "#626b78"],
                      ["Violeta", "#4c1d95", "#7c3aed"],
                    ].map(([name, primary, accent]) => (
                      <button
                        key={name}
                        title={name}
                        className={design.primary === primary ? "chosen" : ""}
                        style={{ background: primary }}
                        onClick={() => setDesign({ primary, accent })}
                      >
                        {design.primary === primary && <Check size={18} />}
                      </button>
                    ))}
                  </div>
                  <div className="color-grid">
                    <label>
                      Color principal
                      <input
                        type="color"
                        value={design.primary}
                        onChange={(e) => setDesign({ primary: e.target.value })}
                      />
                    </label>
                    <label>
                      Color secundario
                      <input
                        type="color"
                        value={design.accent}
                        onChange={(e) => setDesign({ accent: e.target.value })}
                      />
                    </label>
                  </div>
                  <label className="control-label">
                    Tipografía
                    <select
                      value={design.font}
                      onChange={(e) => setDesign({ font: e.target.value })}
                    >
                      <option>Arial</option>
                      <option>Georgia</option>
                      <option>Courier New</option>
                    </select>
                  </label>
                  {[
                    [
                      "scale",
                      "Escala del texto",
                      0.8,
                      1.3,
                      0.05,
                      `${Math.round(design.scale * 100)} %`,
                    ],
                    [
                      "spacing",
                      "Interlineado",
                      1.1,
                      1.8,
                      0.05,
                      design.spacing.toFixed(2),
                    ],
                    ["margin", "Márgenes", 12, 28, 1, `${design.margin} mm`],
                  ].map(([key, name, min, max, step, val]) => (
                    <label className="control-label range-label" key={key}>
                      <span>
                        {name}
                        <b>{val}</b>
                      </span>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={step}
                        value={design[key]}
                        onChange={(e) =>
                          setDesign({ [key]: Number(e.target.value) })
                        }
                      />
                    </label>
                  ))}
                  <label className="control-label">
                    Formato de página
                    <select
                      value={design.paper}
                      onChange={(e) => setDesign({ paper: e.target.value })}
                    >
                      <option value="a4">A4 · 210 × 297 mm</option>
                      <option value="letter">Carta · 216 × 279 mm</option>
                    </select>
                  </label>
                  <button
                    className="text-button"
                    onClick={() =>
                      setDesign({
                        primary: "#244936",
                        accent: "#56785e",
                        scale: 1,
                        font: "Arial",
                        spacing: 1.4,
                        margin: 18,
                        paper: "a4",
                      })
                    }
                  >
                    <RotateCcw size={14} /> Restablecer diseño
                  </button>
                </div>
              </div>
            ) : tab === "ats" ? (
              <div className="editor-card">
                <div className="card-heading">
                  <div>
                    <h2>Una buena primera impresión</h2>
                    <p>Revisa lo que cuentas y cómo lo cuentas.</p>
                  </div>
                  <ShieldCheck size={24} />
                </div>
                <div className="ats-list">
                  {checks.map((c) => (
                    <div key={c.title} className="ats-check">
                      <span className={c.ok ? "pass" : "pending"}>
                        {c.ok ? <Check size={16} /> : <Sparkles size={16} />}
                      </span>
                      <div>
                        <strong>{c.title}</strong>
                        <p>{c.tip}</p>
                      </div>
                    </div>
                  ))}
                  <p className="ats-disclaimer">
                    Estas son recomendaciones de contenido, no una puntuación
                    ATS. Adapta las palabras clave a cada vacante. El resultado
                    depende del sistema y de los requisitos del puesto.
                  </p>
                </div>
              </div>
            ) : (
              <div className="editor-card" key={active}>
                <div className="card-heading">
                  <div>
                    <span className="section-kicker">
                      {active === "personal"
                        ? "EMPECEMOS POR TI"
                        : "CADA DETALLE CUENTA"}
                    </span>
                    <h2>
                      {active === "personal"
                        ? "Datos personales"
                        : title(active)}
                    </h2>
                    <p>
                      {active === "personal"
                        ? "Así podrán conocerte y ponerse en contacto contigo."
                        : active === "summary"
                          ? "Presenta lo que sabes hacer y el valor que aportas."
                          : "Tu trayectoria merece ser contada con claridad."}
                    </p>
                  </div>
                  <span className="heading-icon">
                    <Icon name={active} />
                  </span>
                </div>
                {active !== "personal" && (
                  <div className="section-settings">
                    <label>
                      Título de sección
                      <input
                        aria-label="Título de sección"
                        value={title(active)}
                        onChange={(e) =>
                          meta({
                            titles: {
                              ...data._meta?.titles,
                              [active]: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                    <button
                      className="icon-button"
                      title={
                        data._meta?.hidden?.includes(active)
                          ? "Mostrar en el CV"
                          : "Ocultar del CV"
                      }
                      onClick={() =>
                        meta({
                          hidden: data._meta?.hidden?.includes(active)
                            ? data._meta.hidden.filter((k) => k !== active)
                            : [...(data._meta?.hidden || []), active],
                        })
                      }
                    >
                      {data._meta?.hidden?.includes(active) ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                    <button
                      className="icon-button danger"
                      title="Eliminar sección"
                      onClick={() => setDeleteKey(active)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                )}
                <div className="form-body">
                  {active === "personal" ? (
                    <>
                      <div className="avatar-block">
                        <div className="initial-avatar">
                          {data.personal.name
                            ?.split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((x) => x[0])
                            .join("") || "CV"}
                        </div>
                        <div>
                          <strong>El talento es el protagonista</strong>
                          <p>
                            Sin fotografía, para un CV claro y compatible con
                            ATS.
                          </p>
                        </div>
                      </div>
                      <FieldEditor
                        field="personal"
                        value={Object.fromEntries(
                          Object.entries(data.personal).filter(
                            ([key]) => key !== "summary",
                          ),
                        )}
                        onChange={(v) =>
                          setSection("personal", {
                            ...v,
                            summary: data.personal.summary || "",
                          })
                        }
                      />
                    </>
                  ) : (
                    <FieldEditor
                      field={active}
                      value={
                        active === "summary"
                          ? data.personal.summary || ""
                          : data[active]
                      }
                      onChange={(v) => setSection(active, v)}
                    />
                  )}
                </div>
                <div className="card-footer">
                  <ShieldCheck size={15} />
                  <span>
                    Contenido claro. Estructura profesional. Tu mejor versión.
                  </span>
                </div>
              </div>
            )}
            <div className="ats-banner">
              <div className="ats-banner-icon">
                <ShieldCheck size={22} />
              </div>
              <div>
                <strong>Pensado para las oportunidades</strong>
                <p>
                  Una columna, texto legible y secciones reconocibles por ATS.
                </p>
              </div>
              <button
                title="Ver recomendaciones ATS"
                onClick={() => {
                  setTab("ats");
                  setMode("visual");
                }}
              >
                <Plus size={18} />
              </button>
            </div>
            <div className="editor-bottom">
              <span>
                <Check size={14} /> Tu progreso se guarda automáticamente
              </span>
              <button className="text-button" onClick={saveJson}>
                <Download size={14} /> Guardar JSON
              </button>
            </div>
          </section>
          <section className="preview-column">
            <div className="preview-heading">
              <div>
                <Eye size={17} />
                <h2>Vista previa</h2>
                <span className="preview-live">Actualizada</span>
              </div>
              <button
                className="icon-button"
                title="Ocultar vista previa en móvil"
                onClick={() => setMobilePreview(false)}
              >
                <PanelLeftClose size={17} />
              </button>
            </div>
            <div className="preview-stage">
              <div className="paper-label">
                <FileText size={13} /> CORPORATIVO{" "}
                <span>{design.paper.toUpperCase()}</span>
              </div>
              <div className="paper-viewport" ref={previewViewport}>
                <ResumePreview data={data} zoom={zoom} />
              </div>
              <div className="preview-toolbar">
                <span>{design.paper.toUpperCase()} · Diseño continuo</span>
                <div>
                  <button
                    title="Alejar"
                    disabled={zoom <= 0.3}
                    onClick={() => setZoom((z) => Math.max(0.3, z - 0.05))}
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span>{Math.round(zoom * 100)}%</span>
                  <button
                    title="Acercar"
                    disabled={zoom >= 1}
                    onClick={() => setZoom((z) => Math.min(1, z + 0.05))}
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            </div>
            <div className="preview-note">
              <span>
                <span className="tiny-dot" /> Se actualiza con cada cambio
              </span>
              <button
                className="text-button"
                disabled={Boolean(busy)}
                onClick={async () => {
                  setBusy("preview");
                  try {
                    const pdf = await createPdf(data);
                    setPdfUrl(URL.createObjectURL(pdf.output("blob")));
                    setToast(
                      `PDF generado: ${pdf.getNumberOfPages()} página(s)`,
                    );
                  } catch (e) {
                    setToast(e.message);
                  } finally {
                    setBusy("");
                  }
                }}
              >
                <Eye size={14} /> Ver PDF paginado
              </button>
            </div>
          </section>
        </div>
        <footer className="workspace-footer">
          <span>Hecho para tu próximo paso.</span>
          <span>Tu historia. Tu siguiente oportunidad.</span>
        </footer>
      </main>
      {toast && (
        <div className="toast" role="status">
          <CheckCheck size={19} />
          {toast}
          <button aria-label="Cerrar aviso" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {addModal && (
        <div className="modal-backdrop">
          <form
            role="dialog"
            aria-modal="true"
            aria-label="Crear sección"
            className="modal"
            onSubmit={addSection}
          >
            <button
              className="modal-close icon-button"
              type="button"
              aria-label="Cerrar"
              onClick={() => setAddModal(false)}
            >
              <X size={20} />
            </button>
            <span className="heading-icon">
              <Plus size={23} />
            </span>
            <h2>Más espacio para tu historia</h2>
            <p>Crea una sección con la estructura que necesitas.</p>
            <label className="control-label">
              Nombre de la sección
              <input
                required
                autoFocus
                value={newTitle}
                placeholder="Ej. Publicaciones o reconocimientos"
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </label>
            <label className="control-label">
              Estructura
              <select
                value={newType}
                onChange={(e) => {
                  setNewType(e.target.value);
                  if (!newTitle) setNewTitle(label(e.target.value));
                }}
              >
                <option value="custom">
                  Personalizada · título y descripción
                </option>
                <option value="text">Texto libre</option>
                {Object.keys(schemas).map((k) => (
                  <option key={k} value={k}>
                    {label(k)}
                  </option>
                ))}
                <option value="skills">Habilidades agrupadas</option>
              </select>
            </label>
            <button type="submit" className="button primary">
              <Plus size={16} /> Crear sección
            </button>
          </form>
        </div>
      )}
      {deleteKey && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar cambio"
          >
            <h2>
              {deleteKey === "$reset"
                ? "¿Limpiar todo el CV?"
                : "¿Eliminar esta sección?"}
            </h2>
            <p>
              {deleteKey === "$reset"
                ? "Se borrarán los datos y las secciones personalizadas de este currículum. Se conservará una estructura vacía con las secciones sugeridas. Puedes descargar tu JSON antes o deshacer el cambio durante esta sesión."
                : `Se eliminará «${title(deleteKey)}» y su contenido. También puedes ocultarla para conservarla en el JSON.`}
            </p>
            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setDeleteKey(null)}
              >
                Cancelar
              </button>
              <button
                className="button delete-button"
                onClick={() => {
                  if (deleteKey === "$reset") {
                    update(emptyData());
                    setAiDraft({
                      source: "",
                      prompt: buildAiPrompt(),
                      fileName: "",
                    });
                    setActive("personal");
                    setMode("visual");
                    setTab("content");
                    setDeleteKey(null);
                    return;
                  }
                  const next = structuredClone(data);
                  if (deleteKey === "summary") next.personal.summary = "";
                  else delete next[deleteKey];
                  next._meta = {
                    ...next._meta,
                    hidden:
                      deleteKey === "summary"
                        ? [
                            ...new Set([
                              ...(next._meta?.hidden || []),
                              "summary",
                            ]),
                          ]
                        : (next._meta?.hidden || []).filter(
                            (k) => k !== deleteKey,
                          ),
                    order: sections.filter((k) => k !== deleteKey),
                  };
                  update(next);
                  setActive("personal");
                  setDeleteKey(null);
                }}
              >
                {deleteKey === "$reset"
                  ? "Sí, limpiar todo"
                  : "Eliminar sección"}
              </button>
            </div>
          </div>
        </div>
      )}
      {pdfUrl && (
        <div className="modal-backdrop pdf-backdrop">
          <div
            className="pdf-modal"
            role="dialog"
            aria-modal="true"
            aria-label="PDF paginado"
          >
            <div>
              <strong>Vista final · PDF paginado</strong>
              <button
                className="icon-button"
                aria-label="Cerrar PDF"
                onClick={() => setPdfUrl("")}
              >
                <X size={22} />
              </button>
            </div>
            <iframe title="Vista previa del PDF paginado" src={pdfUrl} />
            <p>
              Si tu navegador no muestra el documento,{" "}
              <a href={pdfUrl} download={`${filename(data)}.pdf`}>
                descarga el PDF
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
