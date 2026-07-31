export type Sector =
  | 'manufactura'
  | 'servicios'
  | 'comercio'
  | 'agro'
  | 'tecnologia'
  | 'construccion'
  | 'salud'
  | 'educacion'
  | 'otro';

export type CompanySize = 'micro' | 'pequena' | 'mediana';
export type DigitalLevel = 'ninguno' | 'basico' | 'intermedio' | 'avanzado';

export interface CompanyInfo {
  nombre: string;
  nit: string;
  ciudad: string;
  sector: Sector;
  subsector: string;
  antiguedad: string;
  size: CompanySize;
  empleados: string;
  exporta: boolean;
  mercado: 'local' | 'regional' | 'nacional' | 'internacional';
  certificaciones: boolean;
  digitalLevel: DigitalLevel;
  responsable: string;
  cargo: string;
  email: string;
}

export type AreaId =
  | 'PE'
  | 'GA'
  | 'GF'
  | 'CM'
  | 'PO'
  | 'IT'
  | 'SO'
  | 'IN';

export interface Area {
  id: AreaId;
  name: string;
  shortName: string;
  description: string;
  weight: number;
  color: string;
  lightColor: string;
}

export interface Rec {
  action: string;
  justification: string;
  tool: string;
  doc: string;
  responsible: string;
  priority: 'Alta' | 'Media' | 'Baja';
  months: '1-3' | '3-6' | '6-12';
}

export type ResponseScaleId = 'existence' | 'maturity' | 'frequency' | 'compliance';

export interface ResponseOption {
  score: number;
  label: string;
  desc: string;
}

export interface Question {
  id: string;
  areaId: AreaId;
  text: string;
  help: string;
  weight: 1 | 2 | 3;
  scale: ResponseScaleId;
  showIf?: (info: CompanyInfo, ans: Record<string, number>) => boolean;
  rec: Rec;
}

export interface AreaResult {
  areaId: AreaId;
  score: number;
  level: number;
  questionsCount: number;
  weakQuestions: Array<{ question: Question; score: number }>;
}

export interface DiagnosticResults {
  companyInfo: CompanyInfo;
  answers: Record<string, number>;
  overallScore: number;
  overallLevel: number;
  areaResults: AreaResult[];
  completedAt: Date;
}

export const MATURITY_LEVELS = [
  {
    level: 1,
    name: 'Inicial',
    description: 'Prácticas ad hoc, sin estructura ni documentación formal',
    color: '#C0392B',
    bg: '#FDECEA',
    range: [1.0, 1.8],
  },
  {
    level: 2,
    name: 'En Desarrollo',
    description: 'Existen algunas prácticas pero son informales e inconsistentes',
    color: '#D4871A',
    bg: '#FEF3E2',
    range: [1.9, 2.6],
  },
  {
    level: 3,
    name: 'Definido',
    description: 'Procesos definidos pero implementación incompleta o inconsistente',
    color: '#B8860B',
    bg: '#FEFBE6',
    range: [2.7, 3.4],
  },
  {
    level: 4,
    name: 'Gestionado',
    description: 'Procesos implementados, medidos y funcionando adecuadamente',
    color: '#1E7D4C',
    bg: '#EBF7F0',
    range: [3.5, 4.2],
  },
  {
    level: 5,
    name: 'Optimizado',
    description: 'Excelencia operacional con mejora continua y ventaja competitiva',
    color: '#1A3D6E',
    bg: '#EEF2F8',
    range: [4.3, 5.0],
  },
];

export const RESPONSE_SCALES: Record<ResponseScaleId, { name: string; options: ResponseOption[] }> = {
  existence: {
    name: 'Existencia',
    options: [
      { score: 1, label: 'No', desc: 'No existe o no se cuenta con este elemento' },
      { score: 5, label: 'Sí', desc: 'Sí existe o se cuenta con este elemento' },
    ],
  },
  maturity: {
    name: 'Nivel de madurez',
    options: [
      { score: 1, label: 'No existe', desc: 'Esta práctica no existe en la empresa' },
      { score: 2, label: 'Informal', desc: 'Existe de manera informal' },
      { score: 3, label: 'Parcial', desc: 'Está parcialmente implementado' },
      { score: 4, label: 'Implementado', desc: 'Está implementado y funciona adecuadamente' },
      { score: 5, label: 'Optimizado', desc: 'Está optimizado y en mejora continua' },
    ],
  },
  frequency: {
    name: 'Frecuencia',
    options: [
      { score: 1, label: 'Nunca', desc: 'Nunca ocurre o no se realiza' },
      { score: 2, label: 'Rara vez', desc: 'Ocurre de forma muy esporádica' },
      { score: 3, label: 'Algunas veces', desc: 'Ocurre ocasionalmente, sin consistencia' },
      { score: 4, label: 'Frecuentemente', desc: 'Ocurre con regularidad' },
      { score: 5, label: 'Siempre', desc: 'Ocurre siempre o de forma sistemática' },
    ],
  },
  compliance: {
    name: 'Nivel de cumplimiento',
    options: [
      { score: 1, label: 'No cumple', desc: 'No cumple con el criterio evaluado' },
      { score: 2, label: 'Parcialmente', desc: 'Cumple parcialmente' },
      { score: 3, label: 'En gran medida', desc: 'Cumple en gran medida, con brechas relevantes' },
      { score: 4, label: 'Completamente', desc: 'Cumple completamente' },
      { score: 5, label: 'Supera', desc: 'Supera las buenas prácticas' },
    ],
  },
};
