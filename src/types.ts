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
  | 'TH'
  | 'IT'
  | 'CA'
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

export interface Question {
  id: string;
  areaId: AreaId;
  text: string;
  help: string;
  weight: 1 | 2 | 3;
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

export const OPTION_LABELS = [
  { score: 1, label: 'No existe', desc: 'Esta práctica no existe en la empresa' },
  { score: 2, label: 'Informal', desc: 'Existe de manera informal, sin documentación' },
  { score: 3, label: 'En desarrollo', desc: 'Implementado parcialmente, no es consistente' },
  { score: 4, label: 'Implementado', desc: 'Implementado y funcionando adecuadamente' },
  { score: 5, label: 'Fortaleza', desc: 'Fortaleza consolidada que se mejora continuamente' },
];
