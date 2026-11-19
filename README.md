# Folio · Generador de CV

Aplicación React + Vite para crear un currículum a partir del JSON de `Scripts - Modelo/cv_data.json`. Funciona en el navegador, sin backend ni cuentas.

## Ejecutar

```sh
npm install
npm run dev
```

Abre la dirección que muestra Vite (normalmente http://localhost:5173).

```sh
npm run build       # Compilación de producción en dist/
npm run preview     # Servir la compilación
npm test            # Validación, orden, Word y paginación PDF
npm run format      # Formatear el código
```

## Funciones

- Editar datos personales, perfil, experiencia, educación, habilidades, idiomas, proyectos, voluntariado y membresías.
- Crear secciones con estructuras sugeridas, certificaciones, texto libre o listas personalizadas.
- Agregar y eliminar campos de texto, listas, grupos, números y valores sí/no. Los datos personales usan texto.
- Arrastrar secciones y elementos para ordenarlos. Los botones de subir/bajar permiten hacerlo también con teclado o en móvil.
- Cambiar títulos, ocultar secciones sin borrar contenido y deshacer/rehacer cambios durante la sesión.
- Empezar un CV vacío con las secciones sugeridas, conservando la posibilidad de deshacer.
- Editar JSON, validarlo y aplicarlo al formulario. Al volver al editor visual se aplica el JSON válido; el JSON inválido conserva el último CV y muestra el error. «Descartar cambios» recupera el contenido aplicado.
- Navegar en el JSON desde las secciones del menú: al seleccionar una sección, el editor se desplaza hasta su clave y la selecciona. Perfil profesional apunta a `personal.summary`.
- Limpiar todo el CV, incluidas las secciones personalizadas y el borrador de preparación para IA. El contenido del CV puede recuperarse con Deshacer durante la sesión.
- Importar/exportar JSON completo, incluida la configuración de diseño.
- Personalizar dos colores, fuente, escala, interlineado, márgenes y papel A4/Carta.
- Ver una vista previa continua y abrir el PDF paginado final.
- Descargar Word `.docx` editable y PDF con texto seleccionable, generados en el navegador.

Los cambios aplicados se guardan en `localStorage` de este navegador. El borrador JSON pendiente de aplicar y el historial de deshacer no se conservan al cerrar. Descarga el JSON para mantener una copia o cambiar de navegador. Si el almacenamiento está bloqueado o lleno, la cabecera muestra un aviso. No se sube el contenido del CV a ningún servidor; las fuentes de la interfaz se cargan desde Google Fonts, con alternativas locales.

## JSON compatible

Se conserva el esquema del modelo original. `personal` es un objeto de textos; las secciones de experiencia/formación y otras estructuras sugeridas son listas de objetos; `skills` es un objeto de grupos. Se preservan y editan las secciones y campos adicionales.

```json
{
  "personal": {
    "name": "Tu nombre",
    "title": "Especialidad profesional",
    "email": "nombre@ejemplo.com",
    "phone": "+51 900 000 000",
    "location": "Lima, Perú",
    "summary": "Perfil profesional adaptado al puesto."
  },
  "experience": [
    {
      "company": "Empresa",
      "position": "Cargo",
      "start_date": "enero 2024",
      "end_date": "presente",
      "achievements": ["Logro verificable con contexto y resultados."]
    }
  ],
  "education": [],
  "skills": { "practices": ["Una competencia relevante"] },
  "publicaciones": [{ "name": "Título", "description": "Descripción" }],
  "_meta": {
    "order": ["summary", "experience", "education", "skills", "publicaciones"],
    "titles": { "publicaciones": "Publicaciones" },
    "hidden": [],
    "design": {
      "primary": "#244936",
      "accent": "#56785e",
      "scale": 1,
      "font": "Arial",
      "spacing": 1.4,
      "margin": 18,
      "paper": "a4"
    }
  }
}
```

`summary` en el orden representa `personal.summary`. El encabezado personal permanece al inicio. Las secciones no incluidas en `order` se añaden al final. `hidden` solo oculta contenido de las exportaciones y la vista previa; se conserva en el JSON.

Se reconocen los temas originales `navy`, `rose`, `burgundy`, `emerald`, `purple` y sus alias. `_meta.design` tiene prioridad. Fuentes: Arial, Georgia y Courier New; escala 0.8–1.3; interlineado 1.1–1.8; márgenes 12–28 mm.

## Generar directamente desde un JSON

El nuevo comando usa el mismo modelo y generadores que la aplicación, incluidas secciones personalizadas y configuración `_meta`. Requiere Node.js 22.12+ o 24+.

```sh
npm run generate
npm run generate -- "ruta/mi-cv.json" "outputs"
```

Produce PDF y Word dentro de `outputs` (excluida de Git). Los scripts Python originales se conservan como referencia; la aplicación y el nuevo comando no necesitan Python, Word ni LibreOffice. Se corrigió el uso de CommonJS del generador Word original para poder ejecutarlo en este proyecto ESM; ese script sigue siendo el generador legado, con sus propias opciones.

## Preparar contenido con IA

La opción **Preparar con IA** permite:

1. Descargar un JSON base con campos vacíos y una estructura de ejemplo por sección, sin los datos del CV de muestra.
2. Copiar un prompt que incluye esa estructura y pide a la IA preguntar por información faltante, mejorar la redacción y devolver exclusivamente JSON sin inventar hechos.
3. Subir un CV en PDF con texto o Word `.docx`, extraer su texto localmente, revisarlo o corregirlo y copiar un prompt con la estructura y el contenido actual.
4. Editar o descargar el prompt y regresar al editor JSON para pegar la respuesta y aplicarla. También se aceptan respuestas rodeadas únicamente por un bloque Markdown de tipo `json`.

No hay llamada automática a una API de IA. La persona decide dónde pegar el prompt. El borrador de IA se conserva al cambiar entre vistas durante la sesión y se descarta al recargar o limpiar. Los documentos tienen un límite de 20 MB y los PDF de 60 páginas. Los PDF escaneados necesitan OCR previo; los archivos Word antiguos `.doc` deben guardarse como `.docx`.

La extracción PDF usa PDF.js con un worker incluido en la compilación local; Word usa Mammoth para recuperar texto sin insertar HTML del documento.

## Estructura

```text
src/App.jsx          Navegación, estado, JSON y diseño
src/FieldEditor.jsx  Editor recursivo de campos y listas
src/model.js         Esquemas, validación y modelo de contenido
src/ai.js            Formato base, prompts y navegación del JSON
src/AiTools.jsx       Preparación de contenido para IA
src/extract.js        Extracción local de PDF y Word
src/documentStyle.js  Jerarquía tipográfica y espaciados compartidos
src/ResumePreview.jsx Vista previa con fechas y ubicación a la derecha
src/export.js        Generación de Word y PDF
src/App.css          Estilos de la aplicación
src/index.css        Estilos base
scripts/             Generación desde consola
tests/               Pruebas de datos y exportaciones
Scripts - Modelo/    Datos y generadores de referencia
```

## Documentos y ATS

Los documentos usan una sola columna, encabezados de texto y listas reales en Word, sin tablas ni imágenes para representar el contenido. La guía recomienda contacto completo, formación, competencias y logros verificables. No se inventan métricas ni se promete superar un filtro ATS: el resultado depende de la oferta, el contenido y el sistema utilizado.

El diseño sigue la jerarquía del generador Python de referencia: nombre y título profesional centrados, encabezados compactos con líneas, fechas en cursiva a la derecha, ubicación en la línea del cargo y detalles académicos discretos. Word utiliza tabuladores derechos para las fechas y la ubicación; el PDF posiciona texto real. La alineación de las fechas y el estilo anterior del título profesional no eran restricciones ATS.

La vista continua muestra contenido, orden y estilo. El PDF paginado es la referencia del PDF final; Word puede distribuir las páginas de otra forma según sus fuentes y motor de composición. Las fuentes PDF estándar cubren español y alfabetos latinos occidentales; escrituras como árabe o chino requieren incorporar fuentes Unicode y un motor adecuado.
