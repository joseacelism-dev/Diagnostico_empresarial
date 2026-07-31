import { useEffect, useRef, useState } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Cell, Tooltip, CartesianGrid,
} from 'recharts';
import type { DiagnosticResults, Question } from '../types';
import { AREAS } from '../data/areas';
import { MATURITY_LEVELS, RESPONSE_SCALES } from '../types';
import { getTopRecommendations, getStrengths, getRisks, getOpportunities, getMaturityInfo, getApplicableToolRecs } from '../utils/scoring';
import { ALL_QUESTIONS } from '../data/questions';
import { generatePDF } from '../utils/pdf';

interface Props {
  results: DiagnosticResults;
  onRestart: () => void;
}

// Extrae una etiqueta corta y legible de la pregunta
function shortLabel(text: string): string {
  let t = text.replace(/^¿/, '').trim();
  const prefixes = [
    'La empresa tiene definidos ', 'La empresa tiene una ', 'La empresa tiene un ',
    'La empresa tiene ', 'La empresa cuenta con un ', 'La empresa cuenta con una ',
    'La empresa cuenta con ', 'La empresa utiliza un ', 'La empresa utiliza una ',
    'La empresa utiliza herramientas ', 'La empresa utiliza ', 'La empresa ha realizado ',
    'La empresa ha implementado ', 'La empresa ha explorado ', 'La empresa ha ',
    'La empresa gestiona de manera ', 'La empresa gestiona activamente ',
    'La empresa gestiona adecuadamente ', 'La empresa gestiona ', 'La empresa mide ',
    'La empresa realiza ', 'La empresa elabora ', 'La empresa desarrolla ',
    'La empresa invierte ', 'La empresa exporta ', 'La empresa promueve ',
    'La empresa practica ', 'La empresa considera ', 'La empresa conoce ',
    'La empresa aplica ', 'La empresa implementa ', 'La empresa destina ',
    'La empresa integra ', 'La empresa ofrece ', 'La empresa ',
    'Existe un ', 'Existe una ', 'Existe ', 'Existen ', 'Se realizan ', 'Se miden ',
    'Se utilizan ', 'Se gestionan ', 'Se tienen ', 'Se implementan ', 'Se tienen ',
  ];
  for (const p of prefixes) {
    if (t.toLowerCase().startsWith(p.toLowerCase())) {
      t = t.slice(p.length);
      t = t.charAt(0).toUpperCase() + t.slice(1);
      break;
    }
  }
  t = t.replace(/\?$/, '').trim();
  if (t.length > 68) t = t.slice(0, 65) + '…';
  return t;
}

function answerLabel(question: Question, score: number): string {
  return RESPONSE_SCALES[question.scale].options.find(o => o.score === score)?.label ?? `${score}/5`;
}

function ScoreRing({ score }: { score: number }) {
  const pct = ((score - 1) / 4) * 100;
  const r = 48;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const info = getMaturityInfo(score);
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={120} height={120}>
        <circle cx={60} cy={60} r={r} fill="none" stroke="#E5E7EB" strokeWidth={10} />
        <circle cx={60} cy={60} r={r} fill="none" stroke={info.color}
          strokeWidth={10} strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round" transform="rotate(-90 60 60)" />
      </svg>
      <div className="absolute text-center">
        <div className="font-mono font-500 text-2xl" style={{ color: info.color }}>{score.toFixed(1)}</div>
        <div className="text-xs" style={{ color: '#9CA3AF' }}>/ 5.0</div>
      </div>
    </div>
  );
}

function GapBar({ score, target = 3.5 }: { score: number; target?: number }) {
  const pct = Math.min(100, ((score - 1) / 4) * 100);
  const targetPct = ((target - 1) / 4) * 100;
  const info = getMaturityInfo(score);
  return (
    <div className="relative w-full h-3 rounded-full" style={{ background: '#F3F4F6' }}>
      <div className="absolute left-0 top-0 h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: info.color }} />
      {/* Target marker */}
      <div className="absolute top-0 w-0.5 h-full"
        style={{ left: `${targetPct}%`, background: '#9CA3AF' }} />
      <div className="absolute -top-4 text-xs font-mono" style={{ left: `${targetPct}%`, transform: 'translateX(-50%)', color: '#9CA3AF', fontSize: 9 }}>
        meta
      </div>
    </div>
  );
}

const LEVEL_COLORS: Record<number, string> = { 1: '#B91C1C', 2: '#D97706', 3: '#B45309', 4: '#047857', 5: '#1A3D6E' };

function severityLabel(score: number): { label: string; color: string; bg: string } {
  if (score < 1.9) return { label: 'CRÍTICA', color: '#B91C1C', bg: '#FEF2F2' };
  if (score < 2.7) return { label: 'ALTA', color: '#C2410C', bg: '#FFF7ED' };
  if (score < 3.5) return { label: 'MODERADA', color: '#B45309', bg: '#FEFCE8' };
  return { label: 'MENOR', color: '#047857', bg: '#F0FDF4' };
}

export default function DashboardPage({ results, onRestart }: Props) {
  const radarRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [expandedGap, setExpandedGap] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfDownload, setPdfDownload] = useState<{ url: string; filename: string } | null>(null);

  const applicableQs = ALL_QUESTIONS.filter(q => results.answers[q.id] !== undefined);
  const topRecs = getTopRecommendations(results, applicableQs, 15);
  const toolRecs = getApplicableToolRecs(results);
  const strengths = getStrengths(results, applicableQs);
  const risks = getRisks(results);
  const opportunities = getOpportunities(results);
  const maturityInfo = getMaturityInfo(results.overallScore);

  // ── Fortalezas: áreas con score >= 4 ─────────────────────────────────────
  const strengthAreas = results.areaResults
    .filter(ar => ar.score >= 4)
    .sort((a, b) => b.score - a.score)
    .map(ar => ({
      ...ar,
      area: AREAS.find(a => a.id === ar.areaId)!,
      strongQs: applicableQs.filter(q => q.areaId === ar.areaId && (results.answers[q.id] ?? 0) >= 4),
    }));

  // ── Brechas: áreas con score < 3.5, ordenadas por gravedad ───────────────
  const gapAreas = results.areaResults
    .filter(ar => ar.score < 3.5 && ar.questionsCount > 0)
    .sort((a, b) => a.score - b.score)
    .map(ar => ({
      ...ar,
      area: AREAS.find(a => a.id === ar.areaId)!,
      criticalQs: ar.weakQuestions.filter(wq => wq.score <= 2),
      gap: 3.5 - ar.score,
      sev: severityLabel(ar.score),
      mainAction: ar.weakQuestions[0]?.question.rec ?? null,
    }));

  // ── Oportunidades: áreas 2–3.9 con alto potencial de salto ──────────────
  const opportunityAreas = results.areaResults
    .filter(ar => ar.score >= 2.0 && ar.score < 4.0 && ar.questionsCount > 0)
    .sort((a, b) => (b.weakQuestions.filter(w => w.question.weight === 3).length) - (a.weakQuestions.filter(w => w.question.weight === 3).length))
    .slice(0, 4)
    .map(ar => {
      const area = AREAS.find(a => a.id === ar.areaId)!;
      const highWeightGaps = ar.weakQuestions.filter(w => w.question.weight >= 2);
      const potentialGain = ar.weakQuestions.reduce((sum, wq) => sum + (5 - wq.score) * wq.question.weight, 0);
      const nextLevel = MATURITY_LEVELS.find(l => l.level === ar.level + 1) ?? MATURITY_LEVELS[4];
      return { oar: ar, area, highWeightGaps, potentialGain, nextLevel };
    });

  const radarData = results.areaResults
    .filter(ar => ar.questionsCount > 0)
    .map(ar => ({ subject: AREAS.find(a => a.id === ar.areaId)!.shortName, score: ar.score, fullMark: 5 }));

  const barData = results.areaResults
    .filter(ar => ar.questionsCount > 0)
    .sort((a, b) => b.score - a.score)
    .map(ar => ({ name: AREAS.find(a => a.id === ar.areaId)!.shortName, score: ar.score }));

  useEffect(() => {
    return () => {
      if (pdfDownload?.url) URL.revokeObjectURL(pdfDownload.url);
    };
  }, [pdfDownload?.url]);

  async function handlePDF() {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true);
    try {
      const generated = await generatePDF(results, applicableQs, topRecs, strengths, risks, opportunities, radarRef, barRef);
      setPdfDownload(current => {
        if (current?.url) URL.revokeObjectURL(current.url);
        return generated;
      });
    } catch (error) {
      console.error('Error generating PDF', error);
      window.alert('No se pudo generar el PDF. Intenta nuevamente o revisa si el navegador bloqueó la descarga.');
    } finally {
      setIsGeneratingPDF(false);
    }
  }

  return (
    <div style={{ background: 'var(--color-cream-50)', minHeight: '100vh' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{ background: '#0F2449', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs font-mono mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>DIAGNÓSTICO EMPRESARIAL</div>
            <h1 className="font-display font-700 text-xl text-white">{results.companyInfo.nombre}</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {results.companyInfo.ciudad} · {results.companyInfo.sector} · {new Date(results.completedAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={onRestart} className="px-4 py-2 rounded-lg text-sm transition-opacity opacity-70 hover:opacity-100"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
              Nuevo diagnóstico
            </button>
            <button onClick={handlePDF}
              disabled={isGeneratingPDF}
              className="px-5 py-2 rounded-lg text-sm font-600 flex items-center gap-2 transition-all"
              style={{ background: '#D4A843', color: '#0F2449', fontFamily: 'var(--font-display)', opacity: isGeneratingPDF ? 0.7 : 1, cursor: isGeneratingPDF ? 'wait' : 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#E5B94A')}
              onMouseLeave={e => (e.currentTarget.style.background = '#D4A843')}>
              {isGeneratingPDF ? 'Generando PDF...' : '⬇ Descargar Informe PDF'}
            </button>
            {pdfDownload && (
              <a
                href={pdfDownload.url}
                download={pdfDownload.filename}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-600 transition-all"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.22)', color: 'white', fontFamily: 'var(--font-display)' }}
              >
                Abrir PDF
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* ── KPIs ────────────────────────────────────────────────────────── */}
        <div className="grid gap-5 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {[
            { label: 'Puntaje Global', value: results.overallScore.toFixed(2), sub: 'sobre 5.0', color: maturityInfo.color },
            { label: 'Nivel de Madurez', value: maturityInfo.name, sub: `Nivel ${results.overallLevel} de 5`, color: maturityInfo.color },
            { label: 'Fortalezas', value: String(strengthAreas.length), sub: 'áreas consolidadas', color: '#047857' },
            { label: 'Brechas Activas', value: String(gapAreas.length), sub: 'áreas a mejorar', color: '#D97706' },
            { label: 'Ítems Evaluados', value: String(Object.keys(results.answers).length), sub: 'preguntas respondidas', color: '#1A3D6E' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
              <p className="text-xs font-600 uppercase tracking-wide mb-2" style={{ color: '#9CA3AF', fontFamily: 'var(--font-display)' }}>{k.label}</p>
              <p className="font-display font-700 text-2xl mb-1" style={{ color: k.color }}>{k.value}</p>
              <p className="text-xs" style={{ color: '#9CA3AF' }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Nivel general ───────────────────────────────────────────────── */}
        <div className="rounded-2xl p-6 mb-8 flex items-start gap-6 flex-wrap" style={{ background: maturityInfo.bg, border: `1px solid ${maturityInfo.color}30` }}>
          <div className="text-center shrink-0">
            <ScoreRing score={results.overallScore} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-600" style={{ background: maturityInfo.color, color: 'white', fontFamily: 'var(--font-display)' }}>
                Nivel {results.overallLevel}: {maturityInfo.name}
              </span>
            </div>
            <h2 className="font-display font-700 text-xl mb-2" style={{ color: '#1C1C2E' }}>Interpretación del resultado</h2>
            <p className="text-sm leading-relaxed mb-3" style={{ color: '#374151' }}>{maturityInfo.description}.</p>
            <div className="flex gap-3 flex-wrap">
              {MATURITY_LEVELS.map(l => (
                <div key={l.level} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs" style={{ background: l.level === results.overallLevel ? `${l.color}18` : 'transparent', border: `1px solid ${l.level === results.overallLevel ? l.color : '#E5E7EB'}` }}>
                  <div className="w-2 h-2 rounded-full" style={{ background: l.level === results.overallLevel ? l.color : '#D1D5DB' }} />
                  <span style={{ color: l.level === results.overallLevel ? l.color : '#9CA3AF', fontWeight: l.level === results.overallLevel ? 600 : 400 }}>
                    N{l.level} {l.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Gráficas ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-6 mb-10" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
            <h3 className="font-display font-600 text-base mb-1" style={{ color: '#0F2449' }}>Perfil de Madurez por Área</h3>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Visualización radial de los ejes evaluados</p>
            <div ref={radarRef} style={{ width: '100%', height: 270 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6B7280', fontFamily: 'var(--font-display)' }} />
                  <Radar dataKey="score" stroke="#1A3D6E" fill="#1A3D6E" fillOpacity={0.15} strokeWidth={2} dot={{ fill: '#1A3D6E', r: 3 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
            <h3 className="font-display font-600 text-base mb-1" style={{ color: '#0F2449' }}>Ranking de Áreas</h3>
            <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Color según nivel de madurez alcanzado</p>
            <div ref={barRef} style={{ width: '100%', height: 270 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 24, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickCount={6} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} width={76} />
                  <Tooltip formatter={(v) => [typeof v === 'number' ? v.toFixed(2) : v, 'Puntaje']}
                    contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8 }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {barData.map((_, i) => {
                      const score = barData[i].score;
                      const lvl = score < 1.9 ? 1 : score < 2.7 ? 2 : score < 3.5 ? 3 : score < 4.3 ? 4 : 5;
                      return <Cell key={i} fill={LEVEL_COLORS[lvl]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Tabla resumen de áreas ───────────────────────────────────────── */}
        <div className="rounded-2xl mb-10 overflow-hidden" style={{ border: '1px solid #E5E7EB' }}>
          <div className="px-6 py-4" style={{ background: '#0F2449' }}>
            <h3 className="font-display font-600 text-white">Resultados por Área</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                {['Área', 'Puntaje', 'Nivel', 'Preguntas', 'Brechas'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-600 uppercase tracking-wide" style={{ color: '#6B7280', fontFamily: 'var(--font-display)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.areaResults.sort((a, b) => b.score - a.score).map((ar, i) => {
                const area = AREAS.find(a => a.id === ar.areaId)!;
                const lvlInfo = MATURITY_LEVELS.find(l => l.level === ar.level)!;
                return (
                  <tr key={ar.areaId} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: area.color }} />
                        <span className="text-sm font-500" style={{ color: '#1C1C2E', fontFamily: 'var(--font-display)' }}>{area.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                          <div className="h-full rounded-full" style={{ width: `${(ar.score / 5) * 100}%`, background: lvlInfo.color }} />
                        </div>
                        <span className="font-mono text-sm font-500" style={{ color: lvlInfo.color }}>{ar.score.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-600" style={{ background: lvlInfo.bg, color: lvlInfo.color, fontFamily: 'var(--font-display)' }}>
                        N{ar.level}: {lvlInfo.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-mono" style={{ color: '#6B7280' }}>{ar.questionsCount}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-mono font-500" style={{ color: ar.weakQuestions.length === 0 ? '#047857' : ar.weakQuestions.length <= 2 ? '#D97706' : '#B91C1C' }}>
                        {ar.weakQuestions.length === 0 ? '—' : `${ar.weakQuestions.length} brechas`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN: FORTALEZAS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base" style={{ background: '#047857' }}>✦</div>
            <div>
              <h2 className="font-display font-700 text-xl" style={{ color: '#1C1C2E' }}>Fortalezas Identificadas</h2>
              <p className="text-xs" style={{ color: '#6B7280' }}>
                {strengthAreas.length > 0
                  ? `${strengthAreas.length} área${strengthAreas.length > 1 ? 's' : ''} con desempeño consolidado · ${strengths.length} prácticas de alto nivel`
                  : 'Aún no se identifican áreas consolidadas — el diagnóstico es el primer paso para construirlas'}
              </p>
            </div>
          </div>

          {strengthAreas.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'white', border: '2px dashed #D1FAE5' }}>
              <div className="text-3xl mb-3">🌱</div>
              <h3 className="font-display font-600 mb-2" style={{ color: '#374151' }}>La empresa está en etapa de construcción</h3>
              <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: '#6B7280' }}>
                Ningún área alcanza aún el nivel Gestionado (4.0). Esto es una oportunidad enorme: implementar las acciones del plan de mejora puede transformar el nivel de madurez en 12 meses.
              </p>
            </div>
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {strengthAreas.map(({ areaId, score, level, weakQuestions, area, strongQs }) => {
                const lvlInfo = MATURITY_LEVELS.find(l => l.level === level)!;
                const score5 = strongQs.filter(q => results.answers[q.id] === 5).length;
                const score4 = strongQs.filter(q => results.answers[q.id] === 4).length;
                return (
                  <div key={areaId} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: `1px solid ${area.color}30` }}>
                    {/* Card header */}
                    <div className="px-5 py-4 flex items-center justify-between" style={{ background: `${area.color}0D`, borderBottom: `1px solid ${area.color}20` }}>
                      <div>
                        <p className="text-xs font-mono font-500 mb-0.5" style={{ color: area.color }}>{area.id}</p>
                        <h4 className="font-display font-700 text-sm" style={{ color: '#1C1C2E' }}>{area.name}</h4>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-700 text-2xl" style={{ color: lvlInfo.color }}>{score.toFixed(1)}</div>
                        <span className="text-xs font-600 px-2 py-0.5 rounded-full" style={{ background: lvlInfo.bg, color: lvlInfo.color, fontFamily: 'var(--font-display)' }}>
                          N{level}: {lvlInfo.name}
                        </span>
                      </div>
                    </div>

                    {/* Score bar */}
                    <div className="px-5 pt-4 pb-2">
                      <div className="flex justify-between text-xs mb-1.5" style={{ color: '#9CA3AF' }}>
                        <span>Nivel de desempeño</span>
                        <span className="font-mono">{score.toFixed(2)} / 5.0</span>
                      </div>
                      <div className="w-full h-2 rounded-full" style={{ background: '#F3F4F6' }}>
                        <div className="h-full rounded-full" style={{ width: `${(score / 5) * 100}%`, background: lvlInfo.color }} />
                      </div>
                      <div className="flex gap-3 mt-2">
                        {score5 > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-600" style={{ background: '#D1FAE5', color: '#065F46' }}>{score5} excelente{score5 > 1 ? 's' : ''}</span>}
                        {score4 > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-600" style={{ background: '#ECFDF5', color: '#047857' }}>{score4} bien logrado{score4 > 1 ? 's' : ''}</span>}
                      </div>
                    </div>

                    {/* Strong practices */}
                    <div className="px-5 pb-5 pt-3">
                      <p className="text-xs font-600 uppercase tracking-wide mb-3" style={{ color: '#9CA3AF', fontFamily: 'var(--font-display)' }}>Prácticas consolidadas</p>
                      <ul className="space-y-2">
                        {strongQs.slice(0, 5).map(q => {
                          const s = results.answers[q.id];
                          const label = answerLabel(q, s);
                          return (
                            <li key={q.id} className="flex items-start gap-2.5">
                              <span className="shrink-0 mt-0.5 min-w-6 h-5 px-1.5 rounded-full flex items-center justify-center text-white font-600"
                                style={{ background: s === 5 ? '#047857' : '#059669', fontSize: 9 }}>{label}</span>
                              <span className="text-xs leading-relaxed" style={{ color: '#374151' }}>{shortLabel(q.text)}</span>
                            </li>
                          );
                        })}
                      </ul>
                      {weakQuestions.length > 0 && (
                        <div className="mt-3 pt-3 border-t" style={{ borderColor: '#F3F4F6' }}>
                          <p className="text-xs" style={{ color: '#9CA3AF' }}>
                            {weakQuestions.length} aspecto{weakQuestions.length > 1 ? 's' : ''} dentro de esta área aún puede{weakQuestions.length > 1 ? 'n' : ''} mejorar para llegar a Optimizado.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN: BRECHAS
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base" style={{ background: '#B91C1C' }}>◈</div>
            <div>
              <h2 className="font-display font-700 text-xl" style={{ color: '#1C1C2E' }}>Brechas y Áreas de Mejora</h2>
              <p className="text-xs" style={{ color: '#6B7280' }}>
                {gapAreas.length > 0
                  ? `${gapAreas.filter(g => g.score < 1.9).length} críticas · ${gapAreas.filter(g => g.score >= 1.9 && g.score < 2.7).length} altas · ${gapAreas.filter(g => g.score >= 2.7).length} moderadas — haga clic en cada área para ver el detalle`
                  : 'No se detectan brechas significativas'}
              </p>
            </div>
          </div>

          {gapAreas.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{ background: 'white', border: '2px dashed #D1FAE5' }}>
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="font-display font-600 mb-2" style={{ color: '#374151' }}>Sin brechas críticas identificadas</h3>
              <p className="text-sm" style={{ color: '#6B7280' }}>Todas las áreas alcanzan un nivel Gestionado. El enfoque debe estar en la excelencia y mejora continua.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gapAreas.map(({ areaId, score, level, weakQuestions, questionsCount, area, criticalQs, gap, sev, mainAction }) => {
                const isOpen = expandedGap === areaId;
                return (
                  <div key={areaId} className="rounded-2xl overflow-hidden"
                    style={{ background: 'white', border: `1px solid ${sev.color}25` }}>

                    {/* Header — clickable */}
                    <button
                      className="w-full text-left px-6 py-5 flex items-center gap-4 transition-all"
                      style={{ background: isOpen ? sev.bg : 'white' }}
                      onClick={() => setExpandedGap(isOpen ? null : areaId)}>

                      {/* Severity badge */}
                      <div className="shrink-0 px-2.5 py-1 rounded-lg text-xs font-700" style={{ background: sev.color, color: 'white', fontFamily: 'var(--font-display)', minWidth: 72, textAlign: 'center' }}>
                        {sev.label}
                      </div>

                      {/* Area info + gap bar */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono font-500" style={{ color: area.color }}>{area.id}</span>
                          <h4 className="font-display font-600 text-sm" style={{ color: '#1C1C2E' }}>{area.name}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 relative pt-4">
                            <GapBar score={score} />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-sm font-700" style={{ color: sev.color }}>{score.toFixed(1)}</span>
                            <span className="text-xs" style={{ color: '#9CA3AF' }}>→ meta 3.5</span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded font-600" style={{ background: `${sev.color}18`, color: sev.color }}>
                              −{gap.toFixed(1)} pts
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick stats */}
                      <div className="shrink-0 text-right hidden sm:block">
                        <div className="text-xs font-600" style={{ color: sev.color }}>{weakQuestions.length} brechas</div>
                        <div className="text-xs" style={{ color: '#9CA3AF' }}>{criticalQs.length} críticas</div>
                      </div>

                      {/* Expand toggle */}
                      <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6', color: '#6B7280', fontSize: 10 }}>
                        {isOpen ? '▲' : '▼'}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="border-t" style={{ borderColor: `${sev.color}20` }}>
                        <div className="px-6 py-5 grid grid-cols-2 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>

                          {/* Ítems con brecha */}
                          <div>
                            <p className="text-xs font-600 uppercase tracking-wide mb-3" style={{ color: '#9CA3AF', fontFamily: 'var(--font-display)' }}>
                              Ítems con brecha ({weakQuestions.length})
                            </p>
                            <ul className="space-y-3">
                              {weakQuestions.slice(0, 6).map((wq: { question: Question; score: number }) => {
                                const s = wq.score;
                                const label = answerLabel(wq.question, s);
                                const dotColor = s <= 1 ? '#B91C1C' : s <= 2 ? '#D97706' : '#B45309';
                                return (
                                  <li key={wq.question.id} className="flex items-start gap-3">
                                    <div className="shrink-0 min-w-8 h-6 px-1.5 rounded-full flex items-center justify-center text-white font-600 mt-0.5"
                                      style={{ background: dotColor, fontSize: 9 }}>{label}</div>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-mono text-xs block mb-0.5" style={{ color: '#9CA3AF' }}>{wq.question.id}</span>
                                      <span className="text-xs leading-relaxed block" style={{ color: '#374151' }}>{shortLabel(wq.question.text)}</span>
                                      <div className="flex items-center gap-1 mt-1">
                                        {[1,2,3,4,5].map(n => (
                                          <div key={n} className="h-1 flex-1 rounded-full" style={{ background: n <= s ? dotColor : '#E5E7EB' }} />
                                        ))}
                                        <span className="text-xs ml-1" style={{ color: dotColor }}>{label}</span>
                                      </div>
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>

                          {/* Acción prioritaria */}
                          <div>
                            <p className="text-xs font-600 uppercase tracking-wide mb-3" style={{ color: '#9CA3AF', fontFamily: 'var(--font-display)' }}>
                              Acción prioritaria para cerrar la brecha
                            </p>
                            {mainAction ? (
                              <div className="rounded-xl p-4" style={{ background: sev.bg, border: `1px solid ${sev.color}25` }}>
                                <p className="text-sm font-600 mb-2 leading-snug" style={{ color: '#1C1C2E', fontFamily: 'var(--font-display)' }}>{mainAction.action}</p>
                                <p className="text-xs leading-relaxed mb-4" style={{ color: '#6B7280' }}>{mainAction.justification}</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {[
                                    { icon: '🛠', label: 'Herramienta', val: mainAction.tool },
                                    { icon: '📄', label: 'Documento', val: mainAction.doc },
                                    { icon: '👤', label: 'Responsable', val: mainAction.responsible },
                                    { icon: '⏱', label: 'Plazo', val: `${mainAction.months} meses` },
                                  ].map(item => (
                                    <div key={item.label} className="p-2 rounded-lg" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
                                      <p className="text-xs font-600 mb-0.5" style={{ color: '#9CA3AF', fontFamily: 'var(--font-display)' }}>{item.icon} {item.label}</p>
                                      <p className="text-xs leading-tight" style={{ color: '#374151' }}>{item.val}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs" style={{ color: '#9CA3AF' }}>Ver el plan de recomendaciones para acciones específicas.</p>
                            )}

                            {/* Impacto del cierre de brecha */}
                            <div className="mt-4 p-3 rounded-xl flex items-start gap-2" style={{ background: '#EEF2F8', border: '1px solid #D5E0EE' }}>
                              <span className="text-base shrink-0">📈</span>
                              <p className="text-xs leading-relaxed" style={{ color: '#1A3D6E' }}>
                                <strong>Impacto estimado:</strong> Llevar esta área de <strong>{score.toFixed(1)}</strong> a <strong>3.5</strong> subiría el puntaje global en aprox. <strong>+{((gap * (AREAS.find(a => a.id === areaId)?.weight ?? 1)) / results.areaResults.length).toFixed(2)}</strong> puntos.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN: OPORTUNIDADES DE MEJORA
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base" style={{ background: '#1A3D6E' }}>◉</div>
            <div>
              <h2 className="font-display font-700 text-xl" style={{ color: '#1C1C2E' }}>Oportunidades de Mejora</h2>
              <p className="text-xs" style={{ color: '#6B7280' }}>Áreas donde una inversión focalizada genera el mayor retorno en madurez empresarial</p>
            </div>
          </div>

          <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {opportunityAreas.map(({ oar, area, highWeightGaps, nextLevel }) => (
              <div key={oar.areaId} className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
                <div className="px-5 py-4" style={{ background: 'linear-gradient(135deg, #EEF2F8 0%, #F0F4FA 100%)', borderBottom: '1px solid #E5E7EB' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-500" style={{ color: area.color }}>{area.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-600" style={{ background: '#1A3D6E', color: 'white', fontFamily: 'var(--font-display)' }}>
                      Potencial alto
                    </span>
                  </div>
                  <h4 className="font-display font-700 text-sm" style={{ color: '#0F2449' }}>{area.name}</h4>
                </div>

                <div className="px-5 py-4">
                  {/* Current → target */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-1" style={{ color: '#9CA3AF' }}>
                        <span>Actual</span>
                        <span>Siguiente nivel: {nextLevel.name}</span>
                      </div>
                      <div className="relative h-2.5 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
                        <div className="h-full rounded-full" style={{ width: `${(oar.score / 5) * 100}%`, background: '#1A3D6E' }} />
                        <div className="absolute top-0 h-full w-0.5" style={{ left: `${(nextLevel.range[0] / 5) * 100}%`, background: '#D4A843' }} />
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span className="font-mono font-600" style={{ color: '#1A3D6E' }}>{oar.score.toFixed(1)}</span>
                        <span className="font-mono font-600" style={{ color: '#D4A843' }}>{nextLevel.range[0].toFixed(1)}+</span>
                      </div>
                    </div>
                  </div>

                  {/* What to improve */}
                  <p className="text-xs font-600 uppercase tracking-wide mb-2" style={{ color: '#9CA3AF', fontFamily: 'var(--font-display)' }}>
                    Para alcanzar "{nextLevel.name}", fortalecer:
                  </p>
                  <ul className="space-y-1.5 mb-4">
                    {highWeightGaps.slice(0, 3).map(wq => (
                      <li key={wq.question.id} className="flex items-start gap-2 text-xs" style={{ color: '#374151' }}>
                        <span className="shrink-0 mt-0.5 font-mono font-600" style={{ color: '#D4A843' }}>→</span>
                        <span className="leading-relaxed">{shortLabel(wq.question.text)}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Benefit statement */}
                  <div className="p-3 rounded-xl" style={{ background: '#EEF2F8', border: '1px solid #D5E0EE' }}>
                    <p className="text-xs leading-relaxed" style={{ color: '#1A3D6E' }}>
                      <strong>¿Qué gana la empresa?</strong> {areaOpportunityBenefit(oar.areaId, oar.score)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* General opportunities as pills */}
          {opportunities.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E7EB' }}>
              <p className="text-xs font-600 uppercase tracking-wide mb-3" style={{ color: '#9CA3AF', fontFamily: 'var(--font-display)' }}>Observaciones estratégicas adicionales</p>
              <ul className="space-y-2">
                {opportunities.map((o, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: '#374151' }}>
                    <span className="shrink-0 mt-1 w-5 h-5 rounded-full flex items-center justify-center text-white font-mono text-xs" style={{ background: '#1A3D6E' }}>{i + 1}</span>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ── Riesgos ────────────────────────────────────────────────────── */}
        {risks.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-base" style={{ background: '#92400E' }}>⚠</div>
              <div>
                <h2 className="font-display font-700 text-xl" style={{ color: '#1C1C2E' }}>Riesgos Identificados</h2>
                <p className="text-xs" style={{ color: '#6B7280' }}>Situaciones derivadas del diagnóstico que requieren atención prioritaria</p>
              </div>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {risks.map((r, i) => (
                <div key={i} className="flex items-start gap-4 rounded-2xl p-5" style={{ background: '#FFF7ED', border: '1px solid #FDE68A' }}>
                  <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-mono font-600 text-sm" style={{ background: '#FDE68A', color: '#92400E' }}>{i + 1}</div>
                  <p className="text-sm leading-relaxed" style={{ color: '#78350F' }}>{r}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Recomendaciones de Herramientas ─────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: '#D4A843' }}>🛠</div>
            <div>
              <h2 className="font-display font-700 text-xl" style={{ color: '#1C1C2E' }}>Plan de Implementación de Herramientas Digitales</h2>
              <p className="text-xs" style={{ color: '#6B7280' }}>Ordenadas por urgencia según los resultados del diagnóstico · Cada herramienta indica qué problema resuelve al implementarse</p>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex gap-3 flex-wrap mb-7 mt-4">
            {([
              { label: 'Implementación Inmediata', count: toolRecs.filter(r => r.urgencyOrder === 1).length, color: '#B91C1C', bg: '#FEF2F2' },
              { label: 'Corto Plazo (3-6 m)', count: toolRecs.filter(r => r.urgencyOrder === 2).length, color: '#D97706', bg: '#FFF7ED' },
              { label: 'Mediano Plazo (6-12 m)', count: toolRecs.filter(r => r.urgencyOrder === 3).length, color: '#047857', bg: '#F0FDF4' },
            ] as const).map(pill => pill.count > 0 && (
              <div key={pill.label} className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: pill.bg, border: `1px solid ${pill.color}30` }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-700" style={{ background: pill.color, color: 'white', fontFamily: 'var(--font-mono)' }}>{pill.count}</span>
                <span className="text-xs font-600" style={{ color: pill.color, fontFamily: 'var(--font-display)' }}>{pill.label}</span>
              </div>
            ))}
            {toolRecs.length === 0 && (
              <p className="text-sm" style={{ color: '#6B7280' }}>La empresa tiene un buen nivel de madurez digital. No se identifican brechas críticas de herramientas.</p>
            )}
          </div>

          {/* Urgency groups */}
          {([
            { order: 1 as const, label: 'Implementación Inmediata', sub: 'Primeros 1–3 meses · Resuelven los cuellos de botella más críticos del negocio', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA', headerBg: '#B91C1C' },
            { order: 2 as const, label: 'Corto Plazo', sub: 'Meses 3–6 · Consolidan la operación y potencian el crecimiento', color: '#D97706', bg: '#FFF7ED', border: '#FDE68A', headerBg: '#D97706' },
            { order: 3 as const, label: 'Mediano Plazo', sub: 'Meses 6–12 · Transformación estratégica y diferenciación competitiva', color: '#047857', bg: '#F0FDF4', border: '#A7F3D0', headerBg: '#047857' },
          ] as const).map(group => {
            const groupRecs = toolRecs.filter(r => r.urgencyOrder === group.order);
            if (groupRecs.length === 0) return null;
            return (
              <div key={group.order} className="mb-8">
                {/* Group header */}
                <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl" style={{ background: group.headerBg }}>
                  <span className="text-white font-mono font-700 text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>FASE {group.order}</span>
                  <div>
                    <h3 className="font-display font-700 text-sm text-white">{group.label}</h3>
                    <p className="text-xs text-white" style={{ opacity: 0.85 }}>{group.sub}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {groupRecs.map((tr, idx) => {
                    const area = AREAS.find(a => a.id === tr.areaId)!;
                    return (
                      <div key={tr.id} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${group.border}`, background: 'white' }}>
                        {/* Card header */}
                        <div className="px-5 py-4 flex items-start gap-4" style={{ borderBottom: `1px solid ${group.border}`, background: group.bg }}>
                          <div className="text-2xl shrink-0 mt-0.5">{tr.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="px-2 py-0.5 rounded text-xs font-mono font-500" style={{ background: area.lightColor, color: area.color }}>{tr.areaId}</span>
                              <span className="px-2 py-0.5 rounded text-xs font-600" style={{ background: `${group.color}15`, color: group.color, fontFamily: 'var(--font-display)' }}>
                                {tr.urgency} · {tr.months} meses
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: '#F3F4F6', color: '#6B7280', fontFamily: 'var(--font-display)' }}>{tr.category}</span>
                            </div>
                            <h4 className="font-display font-700 text-base" style={{ color: '#1C1C2E' }}>{idx + 1}. {tr.title}</h4>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {tr.examples.map(ex => (
                                <span key={ex} className="px-2 py-0.5 rounded-full text-xs font-mono" style={{ background: 'white', border: `1px solid ${group.border}`, color: '#374151' }}>{ex}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Card body */}
                        <div className="px-5 py-4 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                          {/* Sin la herramienta */}
                          <div className="rounded-xl p-4" style={{ background: '#FFF9F9', border: '1px solid #FECACA' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm">⚠️</span>
                              <span className="text-xs font-700 uppercase tracking-wide" style={{ color: '#B91C1C', fontFamily: 'var(--font-display)' }}>Situación actual sin la herramienta</span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: '#7F1D1D' }}>{tr.problemSin}</p>
                          </div>

                          {/* Qué soluciona */}
                          <div className="rounded-xl p-4" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm">✅</span>
                              <span className="text-xs font-700 uppercase tracking-wide" style={{ color: '#047857', fontFamily: 'var(--font-display)' }}>Qué resuelve al implementarse</span>
                            </div>
                            <ul className="space-y-1.5">
                              {tr.soluciona.map((s, si) => (
                                <li key={si} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: '#14532D' }}>
                                  <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-white font-700" style={{ background: '#047857', fontSize: 8, marginTop: 1 }}>{si + 1}</span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Beneficio esperado */}
                        <div className="px-5 py-3 flex items-center gap-3" style={{ background: '#FFFBF0', borderTop: `1px solid ${group.border}` }}>
                          <span className="text-base">📈</span>
                          <div>
                            <span className="text-xs font-700" style={{ color: '#92400E', fontFamily: 'var(--font-display)' }}>Beneficio esperado: </span>
                            <span className="text-xs leading-relaxed" style={{ color: '#78350F' }}>{tr.beneficio}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        {/* ── Hoja de Ruta 12 meses ────────────────────────────────────────── */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm" style={{ background: '#1A3D6E' }}>📅</div>
            <div>
              <h2 className="font-display font-700 text-xl" style={{ color: '#1C1C2E' }}>Hoja de Ruta de Implementación a 12 Meses</h2>
              <p className="text-xs" style={{ color: '#6B7280' }}>Secuencia recomendada para maximizar el impacto de cada herramienta</p>
            </div>
          </div>
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {([
              { order: 1 as const, phase: 'FASE 1', label: 'Meses 1–3', sub: 'Implementación Inmediata', color: '#B91C1C', bg: '#FEF2F2', border: '#FECACA' },
              { order: 2 as const, phase: 'FASE 2', label: 'Meses 3–6', sub: 'Corto Plazo', color: '#D97706', bg: '#FFF7ED', border: '#FDE68A' },
              { order: 3 as const, phase: 'FASE 3', label: 'Meses 6–12', sub: 'Mediano Plazo', color: '#047857', bg: '#F0FDF4', border: '#A7F3D0' },
            ] as const).map(ph => {
              const phRecs = toolRecs.filter(r => r.urgencyOrder === ph.order);
              return (
                <div key={ph.order} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${ph.border}` }}>
                  <div className="px-5 py-4" style={{ background: ph.color }}>
                    <div className="text-xs font-mono mb-0.5 text-white" style={{ opacity: 0.8 }}>{ph.phase}</div>
                    <h4 className="font-display font-700 text-sm text-white">{ph.label}</h4>
                    <p className="text-xs mt-0.5 text-white" style={{ opacity: 0.8 }}>{ph.sub}</p>
                  </div>
                  <div className="p-5" style={{ background: ph.bg }}>
                    {phRecs.length === 0 ? (
                      <p className="text-xs" style={{ color: '#9CA3AF' }}>Sin herramientas prioritarias en este período.</p>
                    ) : (
                      <ul className="space-y-3">
                        {phRecs.map((r, ri) => (
                          <li key={r.id} className="flex items-start gap-2.5">
                            <span className="shrink-0 text-base mt-0.5">{r.icon}</span>
                            <div>
                              <p className="text-xs font-600 leading-tight" style={{ color: '#1C1C2E', fontFamily: 'var(--font-display)' }}>{r.title}</p>
                              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{r.category}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA PDF ──────────────────────────────────────────────────────── */}
        <div className="text-center py-6">
          <button onClick={handlePDF}
            disabled={isGeneratingPDF}
            className="px-8 py-4 rounded-xl font-display font-600 text-base flex items-center gap-2 mx-auto transition-all"
            style={{ background: '#0F2449', color: 'white', opacity: isGeneratingPDF ? 0.7 : 1, cursor: isGeneratingPDF ? 'wait' : 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1A3D6E')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0F2449')}>
            {isGeneratingPDF ? 'Generando PDF...' : '⬇ Descargar Informe Ejecutivo en PDF'}
          </button>
          <p className="text-xs mt-3" style={{ color: '#9CA3AF' }}>
            El informe incluye portada, resultados completos, gráficas y plan de acción a 12 meses.
          </p>
          {pdfDownload && (
            <div className="mt-4 inline-flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: '#EEF2F8', border: '1px solid #D5E0EE' }}>
              <span className="text-sm" style={{ color: '#1A3D6E' }}>PDF listo.</span>
              <a href={pdfDownload.url} download={pdfDownload.filename} className="text-sm font-600 underline" style={{ color: '#0F2449', fontFamily: 'var(--font-display)' }}>
                Descargar ahora
              </a>
              <a href={pdfDownload.url} target="_blank" rel="noopener noreferrer" className="text-sm font-600 underline" style={{ color: '#0F2449', fontFamily: 'var(--font-display)' }}>
                Abrir en pestaña
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function areaOpportunityBenefit(areaId: string, score: number): string {
  const low = score < 2.5;
  const map: Record<string, string> = {
    PE: low
      ? 'Contar con una dirección estratégica clara reduce la toma de decisiones reactiva, atrae inversión y alinea a todo el equipo hacia un mismo objetivo de crecimiento.'
      : 'Afinar la planeación estratégica permite aprovechar oportunidades de mercado más rápido y con mayor precisión que los competidores.',
    GA: low
      ? 'Estructurar los procesos administrativos y controles internos evita pérdidas por fraude, reduce costos operativos y permite escalar el negocio sin caos.'
      : 'Fortalecer el gobierno corporativo mejora la confianza de clientes, socios financieros y facilita el acceso a contratos más grandes.',
    GF: low
      ? 'Tener una gestión financiera sólida es la diferencia entre sobrevivir y crecer: permite saber si el negocio es rentable, anticipar problemas de liquidez y tomar decisiones de inversión informadas.'
      : 'Optimizar la gestión financiera mejora los márgenes, reduce el costo de capital y aumenta el valor de la empresa para potenciales inversionistas o compradores.',
    CM: low
      ? 'Una estrategia comercial definida permite multiplicar las ventas sin aumentar proporcionalmente los costos, reteniendo más clientes y atrayendo nuevos con menor esfuerzo.'
      : 'Potenciar la gestión comercial con datos y segmentación permite aumentar el ticket promedio, reducir el churn y acelerar el ciclo de venta.',
    PO: low
      ? 'Documentar y optimizar los procesos operativos reduce costos, mejora la calidad del producto o servicio y permite crecer sin depender de una sola persona clave.'
      : 'Implementar mejora continua en operaciones libera capacidad instalada y reduce el costo por unidad, mejorando la competitividad en precio sin sacrificar margen.',
    IT: low
      ? 'Digitalizar los procesos clave reduce costos operativos, elimina errores manuales y libera tiempo del equipo para actividades de mayor valor agregado.'
      : 'Avanzar en transformación digital abre la puerta a modelos de negocio más escalables, análisis predictivo y automatización que multiplican la eficiencia.',
    SO: low
      ? 'Adoptar prácticas de sostenibilidad reduce costos operativos (energía, residuos) y posiciona a la empresa favorablemente ante clientes que priorizan proveedores responsables.'
      : 'Comunicar activamente las prácticas ESG se convierte en un diferenciador comercial y mejora el acceso a financiamiento verde e inversión de impacto.',
    IN: low
      ? 'Explorar mercados internacionales puede duplicar el potencial de ingresos de la empresa y reducir la dependencia de un solo mercado o ciclo económico local.'
      : 'Profundizar en los mercados internacionales actuales y diversificar a nuevos destinos aumenta la resiliencia del negocio ante fluctuaciones económicas locales.',
  };
  return map[areaId] ?? 'Mejorar esta área impacta directamente la competitividad y sostenibilidad del negocio.';
}
