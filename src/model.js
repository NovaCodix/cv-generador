export const labels = {
  personal: "Datos personales",
  summary: "Perfil profesional",
  experience: "Experiencia profesional",
  education: "Educación",
  skills: "Habilidades",
  languages: "Idiomas",
  projects: "Proyectos",
  volunteering: "Voluntariado",
  memberships: "Membresías",
  certifications: "Certificaciones",
  name: "Nombre completo",
  title: "Título profesional",
  email: "Correo electrónico",
  phone: "Teléfono",
  location: "Ubicación",
  linkedin: "LinkedIn",
  github: "GitHub",
  website: "Sitio web",
  company: "Empresa",
  position: "Cargo",
  start_date: "Fecha de inicio",
  end_date: "Fecha de fin",
  achievements: "Logros y responsabilidades",
  institution: "Institución",
  degree: "Grado o título",
  details: "Detalles",
  description: "Descripción",
  organization: "Organización",
  role: "Rol",
  language: "Idioma",
  level: "Nivel",
  practices: "Competencias",
  tech: "Tecnologías",
  url: "Enlace",
  issuer: "Entidad emisora",
  date: "Fecha",
  credential: "Credencial",
  technical: "Habilidades técnicas",
};
export const label = (key) =>
  Object.hasOwn(labels, key) ? labels[key] : key.replaceAll("_", " ");
export const schemas = {
  experience: {
    company: "",
    position: "",
    location: "",
    start_date: "",
    end_date: "",
    achievements: [""],
  },
  education: {
    institution: "",
    degree: "",
    start_date: "",
    end_date: "",
    details: "",
  },
  projects: { name: "", description: "", tech: "", url: "" },
  languages: { language: "", level: "" },
  volunteering: {
    organization: "",
    role: "",
    location: "",
    start_date: "",
    end_date: "",
    details: "",
  },
  memberships: {
    organization: "",
    role: "",
    start_date: "",
    end_date: "",
    details: "",
  },
  certifications: { name: "", issuer: "", date: "", url: "" },
};
export const defaults = {
  primary: "#244936",
  accent: "#56785e",
  scale: 1,
  font: "Arial",
  spacing: 1.4,
  margin: 18,
  paper: "a4",
};
// The application always starts from an empty schema, without bundled CV data.
export function emptyData() {
  return {
    personal: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
      website: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: { technical: [], practices: [] },
    languages: [],
    certifications: [],
    projects: [],
    volunteering: [],
    memberships: [],
    _meta: {
      order: [
        "summary",
        "experience",
        "education",
        "skills",
        "languages",
        "certifications",
        "projects",
        "volunteering",
        "memberships",
      ],
      titles: {},
      hidden: [],
      design: { ...defaults },
    },
  };
}
export function validate(data) {
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error("El CV debe ser un objeto JSON.");
  if (
    !data.personal ||
    typeof data.personal !== "object" ||
    Array.isArray(data.personal)
  )
    throw new Error("Incluye un objeto «personal» con los datos de contacto.");
  for (const [key, value] of Object.entries(data.personal))
    if (typeof value !== "string")
      throw new Error(`personal.${key} debe ser texto.`);
  for (const key of Object.keys(schemas)) {
    if (
      data[key] !== undefined &&
      (!Array.isArray(data[key]) ||
        data[key].some(
          (item) => !item || typeof item !== "object" || Array.isArray(item),
        ))
    )
      throw new Error(`${key} debe ser una lista de objetos.`);
    for (const item of data[key] || []) {
      for (const [field, template] of Object.entries(schemas[key])) {
        if (
          typeof template === "string" &&
          item[field] !== undefined &&
          typeof item[field] !== "string"
        )
          throw new Error(`${key}.${field} debe ser texto.`);
      }
    }
  }
  for (const item of data.experience || [])
    if (
      item.achievements !== undefined &&
      (!Array.isArray(item.achievements) ||
        item.achievements.some((x) => typeof x !== "string"))
    )
      throw new Error(
        "Los logros de experiencia deben ser una lista de textos.",
      );
  if (
    data.skills !== undefined &&
    (!data.skills ||
      typeof data.skills !== "object" ||
      Array.isArray(data.skills))
  )
    throw new Error("skills debe ser un objeto con grupos de habilidades.");
  if (data._meta !== undefined) {
    const m = data._meta;
    if (!m || typeof m !== "object" || Array.isArray(m))
      throw new Error("_meta debe ser un objeto.");
    for (const k of ["order", "hidden"])
      if (
        m[k] !== undefined &&
        (!Array.isArray(m[k]) || m[k].some((x) => typeof x !== "string"))
      )
        throw new Error(`_meta.${k} debe ser una lista de textos.`);
    if (
      m.titles &&
      (typeof m.titles !== "object" ||
        Array.isArray(m.titles) ||
        Object.values(m.titles).some((x) => typeof x !== "string"))
    )
      throw new Error("_meta.titles debe contener títulos de texto.");
    if (
      m.design !== undefined &&
      (!m.design || typeof m.design !== "object" || Array.isArray(m.design))
    )
      throw new Error("_meta.design debe ser un objeto.");
    const d = m.design || {};
    for (const k of ["primary", "accent"])
      if (d[k] !== undefined && !/^#[\da-f]{6}$/i.test(d[k]))
        throw new Error(`El color ${k} debe tener formato #123456.`);
    for (const [k, min, max] of [
      ["scale", 0.8, 1.3],
      ["spacing", 1.1, 1.8],
      ["margin", 12, 28],
    ])
      if (
        d[k] !== undefined &&
        (typeof d[k] !== "number" || d[k] < min || d[k] > max)
      )
        throw new Error(`${k} debe estar entre ${min} y ${max}.`);
    if (
      d.font !== undefined &&
      !["Arial", "Georgia", "Courier New"].includes(d.font)
    )
      throw new Error("Fuente no admitida.");
    if (d.paper !== undefined && !["a4", "letter"].includes(d.paper))
      throw new Error("Formato de página no admitido.");
  }
  return data;
}
export function sectionKeys(data) {
  const keys = [
    "summary",
    ...Object.keys(data).filter(
      (k) => !["personal", "_meta", "theme"].includes(k),
    ),
  ];
  return [...new Set([...(data._meta?.order || []), ...keys])].filter((k) =>
    keys.includes(k),
  );
}
export function designOf(data) {
  const palettes = {
    navy: ["#1b3a6b", "#0f7b6c"],
    rose: ["#831843", "#be185d"],
    burgundy: ["#6b1124", "#a82845"],
    emerald: ["#064e3b", "#047857"],
    purple: ["#4c1d95", "#7c3aed"],
  };
  const aliases = {
    default: "navy",
    azul: "navy",
    pink: "rose",
    rosa: "rose",
    mujer: "rose",
    vino: "burgundy",
    verde: "emerald",
    morado: "purple",
  };
  const theme = data.theme || data.personal?.theme;
  const palette =
    typeof theme === "string" ? palettes[aliases[theme] || theme] : null;
  const legacy = palette ? { primary: palette[0], accent: palette[1] } : {};
  if (theme && typeof theme === "object") {
    for (const [key, value] of [
      ["primary", theme.primary],
      ["accent", theme.secondary],
    ]) {
      if (typeof value === "string" && /^#?[\da-f]{6}$/i.test(value))
        legacy[key] = `#${value.replace("#", "")}`;
    }
  }
  return { ...defaults, ...legacy, ...data._meta?.design };
}
export const titleOf = (data, key) =>
  data._meta?.titles && Object.hasOwn(data._meta.titles, key)
    ? data._meta.titles[key]
    : label(key);
export function move(list, from, to) {
  const next = [...list];
  const [v] = next.splice(from, 1);
  next.splice(to, 0, v);
  return next;
}
export function blank(value) {
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, blank(v)]),
    );
  return typeof value === "number"
    ? 0
    : typeof value === "boolean"
      ? false
      : "";
}
// A single ordered text model powers the preview, PDF and Word exports.
export function blocksOf(data) {
  const out = [],
    p = data.personal;
  if (p.name) out.push({ kind: "name", text: p.name });
  if (p.title) out.push({ kind: "title", text: p.title });
  const contact = ["email", "phone", "location"]
    .map((k) => p[k])
    .filter(Boolean);
  if (contact.length)
    out.push({ kind: "contact", text: contact.join("  |  ") });
  const links = ["linkedin", "github", "website"]
    .map((k) => p[k])
    .filter(Boolean);
  if (links.length) out.push({ kind: "links", text: links.join("  ·  ") });
  for (const [k, v] of Object.entries(p))
    if (
      ![
        "name",
        "title",
        "summary",
        "email",
        "phone",
        "location",
        "linkedin",
        "github",
        "website",
        "theme",
      ].includes(k) &&
      v
    )
      out.push({ kind: "contact", text: `${label(k)}: ${v}` });
  if (out.length) out.push({ kind: "rule", text: "" });
  const hasContent = (v) =>
    v !== null &&
    v !== undefined &&
    (typeof v === "object"
      ? Object.values(v).some(hasContent)
      : String(v).trim().length > 0);
  const render = (v, key = "") => {
    if (!hasContent(v)) return;
    if (Array.isArray(v)) {
      v.forEach((item) => {
        if (typeof item === "object") render(item, key);
        else if (String(item).trim())
          out.push({ kind: "bullet", text: String(item) });
      });
      return;
    }
    if (typeof v !== "object") {
      out.push({ kind: "text", text: String(v) });
      return;
    }
    if (key === "languages" && typeof v.language === "string") {
      out.push({
        kind: "text",
        text: [v.language, v.level].filter(Boolean).join(": "),
      });
      for (const [k, val] of Object.entries(v))
        if (!["language", "level"].includes(k)) render(val, k);
      return;
    }
    const headlineKey = [
      "company",
      "institution",
      "organization",
      "name",
      "language",
    ].find((k) => v[k] && typeof v[k] !== "object");
    const subKey = ["position", "degree", "role"].find(
      (k) => v[k] && typeof v[k] !== "object",
    );
    const date = [v.start_date, v.end_date].filter(Boolean).join(" – ");
    if (!headlineKey && date) out.push({ kind: "text", text: date });
    if (headlineKey)
      out.push({
        kind: "entry",
        text: String(v[headlineKey]),
        right: date,
      });
    if (subKey)
      out.push({
        kind: "subtitle",
        text: String(v[subKey]),
        right: typeof v.location === "string" ? v.location : "",
      });
    else if (v.location) out.push({ kind: "detail", text: String(v.location) });
    for (const [k, value] of Object.entries(v)) {
      if (!hasContent(value)) continue;
      if (
        [headlineKey, subKey, "start_date", "end_date", "location"].includes(k)
      )
        continue;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        out.push({ kind: "entry", text: label(k) });
        render(value, k);
      } else if (Array.isArray(value)) {
        if (key === "skills" && value.every((x) => typeof x === "string"))
          out.push({
            kind: "skills",
            text: label(k),
            value: value.filter((x) => x.trim()).join(" · "),
          });
        else render(value, k);
      } else if (value !== "" && value !== null)
        out.push({
          kind: key === "education" && k === "details" ? "detail" : "text",
          text: String(value),
        });
    }
  };
  for (const key of sectionKeys(data)) {
    if (data._meta?.hidden?.includes(key)) continue;
    const value = key === "summary" ? p.summary : data[key];
    if (!hasContent(value)) continue;
    const start = out.length;
    out.push({ kind: "heading", text: titleOf(data, key) });
    render(value, key);
    if (out.length === start + 1) out.pop();
  }
  return out;
}
export function atsChecks(data) {
  return [
    {
      ok: Boolean(
        data.personal.name?.trim() &&
        data.personal.email?.includes("@") &&
        data.personal.phone?.trim(),
      ),
      title: "Datos de contacto completos",
      tip: "Incluye nombre, correo válido y teléfono.",
    },
    {
      ok: Boolean(data.personal.summary?.length >= 100),
      title: "Un perfil con contexto",
      tip: "Resume tu especialidad y tu propuesta de valor en 3–5 líneas.",
    },
    {
      ok: Boolean(data.experience?.length),
      title: "Experiencia profesional",
      tip: "Añade experiencia relevante y fechas claras.",
    },
    {
      ok: (data.experience || []).some((x) =>
        x.achievements?.some((s) => /\d/.test(s)),
      ),
      title: "Logros con resultados medibles",
      tip: "Si es verificable, usa cifras: volumen de casos, ahorro o mejoras. No inventes resultados.",
    },
    {
      ok: Boolean(data.education?.length),
      title: "Formación académica",
      tip: "Indica institución y título obtenido.",
    },
    {
      ok: Boolean(
        data.skills &&
        Object.values(data.skills).some((x) =>
          Array.isArray(x) ? x.length : x,
        ),
      ),
      title: "Competencias relevantes",
      tip: "Incluye habilidades que coincidan con la oferta y que puedas demostrar.",
    },
  ];
}
