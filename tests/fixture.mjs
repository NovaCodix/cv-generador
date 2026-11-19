import { emptyData } from "../src/model.js";

// Synthetic data for tests only. Never imported into the application bundle.
export function testCv() {
  const data = emptyData();
  data.personal = {
    ...data.personal,
    name: "Persona de prueba",
    title: "Profesional de prueba",
    email: "persona@example.test",
    phone: "+00 000 000 000",
    summary:
      "Perfil profesional de prueba para verificar la generación de documentos.",
  };
  data.experience = [
    {
      company: "Empresa Alfa",
      position: "Especialista",
      location: "Ciudad",
      start_date: "agosto 2025",
      end_date: "noviembre 2025",
      achievements: ["Resultado de prueba verificable."],
    },
    {
      company: "Empresa Beta",
      position: "Analista",
      start_date: "2023",
      end_date: "2024",
      achievements: ["Otro resultado de prueba."],
    },
  ];
  data.education = [
    {
      institution: "Universidad de prueba",
      degree: "Título de prueba",
      details: "Formación de prueba.",
    },
  ];
  data.memberships = [
    { organization: "Asociación de prueba", role: "Miembro" },
  ];
  data.skills.practices = ["Competencia de prueba"];
  return data;
}
