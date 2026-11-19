import { useId, useRef, useState } from "react";
import {
  Plus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
} from "lucide-react";
import { schemas, label, blank, move } from "./model.js";

export default function FieldEditor({
  value,
  onChange,
  field = "",
  depth = 0,
  inputId,
}) {
  const prefix = useId();
  const [newField, setNewField] = useState("");
  const [adding, setAdding] = useState(false);
  const [fieldType, setFieldType] = useState("text");
  const [itemType, setItemType] = useState("text");
  const drag = useRef(null);
  const schema = Object.hasOwn(schemas, field) ? schemas[field] : null;
  const newValue = (type) =>
    ({ text: "", list: [], group: {}, number: 0, boolean: false })[type];
  if (Array.isArray(value))
    return (
      <div className="array-fields">
        {value.map((item, index) => (
          <div
            className="array-item"
            key={index}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (drag.current !== null)
                onChange(move(value, drag.current, index));
              drag.current = null;
            }}
          >
            <div className="item-toolbar">
              <span
                draggable
                onDragStart={(e) => {
                  e.stopPropagation();
                  drag.current = index;
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", String(index));
                }}
                onDragEnd={() => {
                  drag.current = null;
                }}
                title="Arrastrar elemento"
                className="grip"
              >
                <GripVertical size={16} />
              </span>
              <span>
                {typeof item === "object" && item
                  ? [
                      item.company,
                      item.institution,
                      item.organization,
                      item.name,
                      item.language,
                    ].find((v) => typeof v === "string" && v.trim()) ||
                    `Elemento ${index + 1}`
                  : `Elemento ${index + 1}`}
              </span>
              <button
                type="button"
                className="icon-button"
                disabled={index === 0}
                title="Subir elemento"
                onClick={() => onChange(move(value, index, index - 1))}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={index === value.length - 1}
                title="Bajar elemento"
                onClick={() => onChange(move(value, index, index + 1))}
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                className="icon-button danger"
                title="Eliminar elemento"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
              >
                <Trash2 size={14} />
              </button>
            </div>
            <FieldEditor
              value={item}
              field={field}
              depth={depth + 1}
              onChange={(next) =>
                onChange(value.map((x, i) => (i === index ? next : x)))
              }
            />
          </div>
        ))}
        <div className="array-add-row">
          {!schema && !value.length && (
            <select
              aria-label="Tipo de elemento"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
            >
              <option value="text">Texto</option>
              <option value="group">Objeto</option>
              <option value="list">Lista</option>
            </select>
          )}
          <button
            type="button"
            className="add-item"
            onClick={() =>
              onChange([
                ...value,
                structuredClone(
                  schema ||
                    (value.length ? blank(value[0]) : newValue(itemType)),
                ),
              ])
            }
          >
            <Plus size={16} />{" "}
            {schema
              ? `Añadir ${field === "experience" ? "experiencia" : field === "education" ? "formación" : "elemento"}`
              : "Añadir elemento"}
          </button>
        </div>
      </div>
    );
  if (value !== null && typeof value === "object")
    return (
      <div className={`object-fields depth-${depth}`}>
        {Object.entries(value).map(([key, v]) => (
          <div
            key={key}
            className={`field ${typeof v === "object" || ["summary", "details", "description", "achievements"].includes(key) ? "wide" : ""}`}
          >
            <div className="field-label">
              <label htmlFor={`${prefix}-${key}`}>{label(key)}</label>
              <button
                type="button"
                className="field-remove"
                title={`Eliminar campo ${label(key)}`}
                onClick={() => {
                  const next = { ...value };
                  delete next[key];
                  onChange(next);
                }}
              >
                <X size={12} />
              </button>
            </div>
            <FieldEditor
              inputId={`${prefix}-${key}`}
              field={key}
              value={v}
              depth={depth + 1}
              onChange={(next) => onChange({ ...value, [key]: next })}
            />
          </div>
        ))}
        <div className="wide">
          {adding ? (
            <form
              className="inline-add"
              onSubmit={(e) => {
                e.preventDefault();
                const key = newField.trim();
                if (
                  key &&
                  !Object.hasOwn(value, key) &&
                  !["__proto__", "constructor", "prototype"].includes(key)
                ) {
                  onChange({ ...value, [key]: newValue(fieldType) });
                  setNewField("");
                  setAdding(false);
                }
              }}
            >
              <input
                autoFocus
                aria-label="Nombre del campo"
                placeholder="Nombre del campo"
                value={newField}
                onChange={(e) => setNewField(e.target.value)}
              />
              {field !== "personal" && (
                <select
                  aria-label="Tipo del campo"
                  value={fieldType}
                  onChange={(e) => setFieldType(e.target.value)}
                >
                  <option value="text">Texto</option>
                  <option value="list">Lista</option>
                  <option value="group">Grupo</option>
                  <option value="number">Número</option>
                  <option value="boolean">Sí / No</option>
                </select>
              )}
              <button className="button small" type="submit">
                Añadir
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={() => setAdding(false)}
              >
                <X size={16} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="text-button"
              onClick={() => setAdding(true)}
            >
              <Plus size={14} /> Añadir campo
            </button>
          )}
        </div>
      </div>
    );
  if (typeof value === "boolean")
    return (
      <label className="toggle-label">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />{" "}
        Activado
      </label>
    );
  if (typeof value === "number")
    return (
      <input
        id={inputId}
        type="number"
        aria-label={label(field)}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  const long =
    ["summary", "details", "description"].includes(field) ||
    String(value || "").length > 110 ||
    field === "achievements";
  return long ? (
    <textarea
      id={inputId}
      aria-label={label(field)}
      rows={field === "summary" ? 6 : 3}
      value={value ?? ""}
      placeholder={`Escribe ${label(field).toLowerCase()}…`}
      onChange={(e) => onChange(e.target.value)}
    />
  ) : (
    <input
      id={inputId}
      aria-label={label(field)}
      value={value ?? ""}
      placeholder={
        field === "end_date" ? "Ej. noviembre 2026 o presente" : label(field)
      }
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
